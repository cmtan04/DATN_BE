export interface FileUpload {
  fieldname: string; // folder trong cloudinary
  originalname: string; // tên file gốc
  encoding: string; // mã hóa
  mimetype: string; // loại file
  size: number; // kích thước file
  buffer: Buffer; // dữ liệu nhị phân
}
