<template>
  <div class="login-overlay">
    <div class="login-box shadow-lg">
      <img src="https://cdn-icons-png.flaticon.com/512/17167/17167932.png"
           alt="Logo" style="height:75px;margin-bottom:15px">
      <h4 class="fw-bold text-primary mb-1" style="letter-spacing:1px">GUDANG WARNA</h4>
      <p class="text-muted small mb-4 fw-bold">Monitoring Sistem</p>
      <button class="btn-google shadow-sm mb-4" @click="loginGoogle">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22">
        Masuk dengan Google
      </button>
      <div class="d-flex align-items-center justify-content-center text-muted"
           style="font-size:.7rem;opacity:.8">
        <i class="fas fa-shield-alt text-success me-2" style="font-size:.9rem"></i>
        <span>Keamanan Data Pengguna Terjamin oleh Google</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'
const { loginGoogle } = useAuth()
</script>

<style scoped>
.login-overlay {
  position: fixed; inset: 0; background: #1e3c72;
  z-index: 10000; display: flex;
  align-items: center; justify-content: center;
}
.login-box {
  background: #fff; padding: 40px; border-radius: 20px;
  width: 90%; max-width: 400px; text-align: center;
}
.btn-google {
  background: #fff; color: #444; border: 1px solid #ddd;
  font-weight: 600; padding: 12px; border-radius: 50px;
  width: 100%; display: flex; align-items: center;
  justify-content: center; gap: 10px; cursor: pointer;
  transition: .2s;
}
.btn-google:hover { background: #f8f9fa; }
</style>
