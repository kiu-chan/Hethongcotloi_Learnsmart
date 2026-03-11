import * as XLSX from 'xlsx';

export const exportClassesToExcel = (classes) => {
  const rows = [];
  for (const cls of classes) {
    const teachers = cls.teachers || [];
    const students = cls.students || [];
    if (teachers.length === 0 && students.length === 0) {
      rows.push({ 'Tên lớp': cls.name, 'Vai trò': '', 'Email': '', 'Họ và tên': '', 'Chủ nhiệm': '' });
    } else {
      for (const t of teachers) {
        rows.push({
          'Tên lớp': cls.name,
          'Vai trò': 'teacher',
          'Email': t.email,
          'Họ và tên': t.name,
          'Chủ nhiệm': cls.homeroomTeacher?._id?.toString() === t._id?.toString() ? 'Có' : '',
        });
      }
      for (const s of students) {
        rows.push({ 'Tên lớp': cls.name, 'Vai trò': 'student', 'Email': s.email, 'Họ và tên': s.name, 'Chủ nhiệm': '' });
      }
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lớp học');
  XLSX.writeFile(wb, 'danh_sach_lop_hoc.xlsx');
};

export const downloadTemplate = () => {
  const rows = [
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'teacher', 'Email': 'giaovien@example.com', 'Họ và tên': 'Nguyễn Văn A', 'Mật khẩu': '12345678' },
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'student', 'Email': 'hocsinh1@example.com', 'Họ và tên': 'Trần Thị B', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'student', 'Email': 'hocsinh2@example.com', 'Họ và tên': 'Lê Văn C', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A2', 'Vai trò': 'teacher', 'Email': 'giaovien2@example.com', 'Họ và tên': 'Phạm Thị D', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A2', 'Vai trò': 'student', 'Email': 'hocsinh3@example.com', 'Họ và tên': 'Hoàng Văn E', 'Mật khẩu': '' },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu');
  XLSX.writeFile(wb, 'mau_nhap_lop_hoc.xlsx');
};
