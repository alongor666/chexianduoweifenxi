/**
 * Application 层公开接口
 *
 * 提供用例（Use Case）级别的业务流程封装
 */

// 数据上传用例
export {
  UploadDataUseCase,
  type UploadConfig,
  type UploadResult,
  type UploadError,
  type UploadProgress,
  type ProgressCallback,
} from './upload-data-usecase'
