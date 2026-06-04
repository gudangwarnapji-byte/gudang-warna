<template>
  <nav class="navbar navbar-dark mb-2">
    <div class="container d-flex justify-content-between align-items-center">
      <a class="navbar-brand d-flex align-items-center gap-2" href="#" style="padding:0">
        <img src="https://cdn-icons-png.flaticon.com/512/17167/17167932.png"
             alt="Logo" style="height:38px">
        <div class="d-flex flex-column justify-content-center">
          <div class="fw-bold" style="font-size:1.15rem;line-height:.9;letter-spacing:-.5px">
            GUDANG <span class="text-info">WARNA</span>
          </div>
          <div style="font-size:.65rem;opacity:.8">
            {{ isAdmin ? 'Administrator' : 'Monitoring Sistem' }}
          </div>
        </div>
      </a>
      <div class="d-flex align-items-center gap-2">
        <img v-if="user?.photoURL" :src="user.photoURL" class="user-avatar">
        <button class="btn btn-sm btn-danger rounded-circle"
                style="width:32px;height:32px;padding:0"
                @click="doLogout">
          <i class="fas fa-power-off"></i>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth, user, currentRole } from '../composables/useAuth'
const { doLogout } = useAuth()
const isAdmin = computed(() => currentRole.value === 'admin')
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
  padding: .8rem 0;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid #fff;
}
</style>
