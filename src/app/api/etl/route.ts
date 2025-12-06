import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// 定义一个临时目录来存储上传的文件和生成的 DuckDB 文件
const UPLOAD_DIR = path.join(os.tmpdir(), 'etl_uploads');
const OUTPUT_DIR = path.join(os.tmpdir(), 'etl_outputs');

// 确保临时目录存在
async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  await ensureDirs();

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  const outputFileName = formData.get('outputFileName') as string;

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, message: '没有文件被上传。' }, { status: 400 });
  }
  if (!outputFileName) {
    return NextResponse.json({ success: false, message: '缺少输出文件名。' }, { status: 400 });
  }

  // 验证输出文件名，防止路径遍历
  const sanitizedOutputFileName = path.basename(outputFileName);
  if (!sanitizedOutputFileName.endsWith('.duckdb')) {
    return NextResponse.json({ success: false, message: '输出文件名必须以 .duckdb 结尾。' }, { status: 400 });
  }

  const tempInputDirPath = path.join(UPLOAD_DIR, Date.now().toString());
  await fs.mkdir(tempInputDirPath, { recursive: true });

  const uploadedFilePaths: string[] = [];
  try {
    // 保存所有上传的文件到临时输入目录
    for (const file of files) {
      const filePath = path.join(tempInputDirPath, file.name);
      await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      uploadedFilePaths.push(filePath);
    }

    const outputDbPath = path.join(OUTPUT_DIR, sanitizedOutputFileName);
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'etl_to_duckdb.py');

    // 检查 Python 脚本是否存在
    try {
      await fs.access(pythonScriptPath, fs.constants.F_OK);
    } catch (e) {
      return NextResponse.json({ success: false, message: `Python 脚本不存在: ${pythonScriptPath}` }, { status: 500 });
    }

    // 执行 Python 脚本
    const pythonProcess = spawn('python3', [
      pythonScriptPath,
      '--input-dir', tempInputDirPath,
      '--output-db', outputDbPath,
    ]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
      console.log(`Python stdout: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
      console.error(`Python stderr: ${data.toString().trim()}`);
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      return NextResponse.json({
        success: false,
        message: `数据加工失败，Python 脚本退出码: ${exitCode}`,
        logs: scriptOutput + scriptError,
      }, { status: 500 });
    }

    // 检查生成的 DuckDB 文件是否存在
    try {
      await fs.access(outputDbPath, fs.constants.F_OK);
    } catch (e) {
      return NextResponse.json({ success: false, message: `Python 脚本未生成预期的 DuckDB 文件: ${sanitizedOutputFileName}`, logs: scriptOutput + scriptError }, { status: 500 });
    }

    // 返回成功响应和下载 URL
    const downloadUrl = `/api/download-duckdb?filename=${encodeURIComponent(sanitizedOutputFileName)}`;
    return NextResponse.json({
      success: true,
      message: '数据加工成功！',
      logs: scriptOutput,
      downloadUrl,
    });

  } catch (error: any) {
    console.error('ETL API 错误:', error);
    return NextResponse.json({ success: false, message: error.message || '服务器内部错误。' }, { status: 500 });
  } finally {
    // 清理临时上传文件
    try {
      if (await fs.stat(tempInputDirPath)) {
        await fs.rm(tempInputDirPath, { recursive: true, force: true });
        console.log(`清理临时上传目录: ${tempInputDirPath}`);
      }
    } catch (e) {
      console.warn(`无法清理临时上传目录 ${tempInputDirPath}:`, e);
    }
  }
}

// 用于下载生成的 DuckDB 文件的 API 路由
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return new NextResponse('缺少文件名参数。', { status: 400 });
  }

  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(OUTPUT_DIR, sanitizedFilename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    return new NextResponse(new Uint8Array(fileBuffer), { headers });
  } catch (error) {
    console.error('下载文件错误:', error);
    return new NextResponse('文件未找到或无法读取。', { status: 404 });
  }
}
