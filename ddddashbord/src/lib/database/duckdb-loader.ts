import * as duckdb from '@duckdb/duckdb-wasm';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// 简单的单例模式
let dbInstance: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB() {
    if (dbInstance) return dbInstance;

    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    dbInstance = db;
    return db;
}

export async function loadDuckDBFile(file: File) {
    const db = await initDuckDB();
    const conn = await db.connect();
    
    try {
        const tableName = 'insurance_records'; // 假设表名
        
        // 注册文件
        await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
        
        // ATTACH 数据库
        // 注意：在 DuckDB WASM 中，直接 attach 上传的文件可能有限制，
        // 但通常 .duckdb 文件就是一个完整的数据库文件。
        await conn.query(`ATTACH '${file.name}' AS user_db`);
        
        // 查询全量数据
        // 注意：DuckDB 返回的 BigInt 在 JSON.stringify 时会报错，需要处理
        const result = await conn.query(`SELECT * FROM user_db.${tableName}`);
        
        // 转换为普通对象数组，并处理 BigInt
        const data = result.toArray().map(row => {
            const obj = row.toJSON();
            // 简单处理 BigInt 为 Number (假设数值在安全范围内)
            for (const key in obj) {
                if (typeof obj[key] === 'bigint') {
                    obj[key] = Number(obj[key]);
                }
            }
            return obj;
        });
        
        return data;
    } finally {
        // 清理
        try {
            await conn.query(`DETACH user_db`);
        } catch (e) {
            console.warn('Detach failed', e);
        }
        await conn.close();
        // 这里的 dropFile 可能会失败如果文件还在占用，暂时忽略
        // await db.dropFile(file.name);
    }
}
