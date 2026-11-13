import Swal from 'sweetalert2';

const baseFontStyle = {
  fontFamily: "'Sarabun', sans-serif"
};

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.style.fontFamily = "'Sarabun', sans-serif";
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showSwalToast = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string,
  text?: string
) => {
  return Toast.fire({
    icon,
    title,
    text
  });
};

export const showSwalAlert = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string,
  text?: string
) => {
  const confirmButtonColor =
    icon === 'error'
      ? '#e11d48'
      : icon === 'warning'
      ? '#d97706'
      : icon === 'success'
      ? '#059669'
      : '#2563eb';

  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor,
    didOpen: (popup) => {
      Object.assign(popup.style, baseFontStyle);
    }
  });
};

export const confirmSwal = async (
  title: string,
  text?: string,
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก',
  icon: 'question' | 'warning' = 'warning'
): Promise<boolean> => {
  const result = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: icon === 'warning' ? '#dc2626' : '#2563eb',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    didOpen: (popup) => {
      Object.assign(popup.style, baseFontStyle);
    }
  });
  return result.isConfirmed;
};
