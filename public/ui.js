document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (toggleButton && sidebar) {
    // Fungsi untuk menyinkronkan ikon tombol dengan status sidebar
    const syncToggleButton = () => {
      const isHidden = sidebar.classList.contains('hidden');
      toggleButton.textContent = isHidden ? '»' : '«';
    };

    // Panggil saat halaman dimuat untuk mengatur ikon awal
    syncToggleButton();

    toggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      syncToggleButton(); // Panggil lagi setiap kali tombol diklik
    });
  }
});