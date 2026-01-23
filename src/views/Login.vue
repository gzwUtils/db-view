<template>
  <div class="login-container">
    <!-- 3D粒子背景 -->
    <div class="particles-3d" ref="particlesContainer"></div>

    <!-- 全息投影效果 -->
    <div class="hologram-effect">
      <div class="hologram-line line-1"></div>
      <div class="hologram-line line-2"></div>
      <div class="hologram-line line-3"></div>
      <div class="hologram-grid"></div>
    </div>

    <!-- 动态数据流 -->
    <div class="data-stream">
      <div class="stream-item" v-for="(stream, index) in dataStreams" :key="index"
           :style="{
             left: `${stream.x}%`,
             animationDelay: `${stream.delay}s`,
             animationDuration: `${stream.duration}s`
           }">
        <span class="binary">{{ stream.text }}</span>
      </div>
    </div>

    <!-- 登录面板 -->
    <div class="login-panel">
      <!-- 顶部扫描线 -->
      <div class="scan-line"></div>

      <!-- 面板主体 -->
      <div class="panel-main">
        <!-- 全息Logo -->
        <div class="holographic-logo">
          <div class="logo-base">
            <div class="logo-cube">
              <div class="cube-face front">DB</div>
              <div class="cube-face back">SQL</div>
              <div class="cube-face right">AI</div>
              <div class="cube-face left">DB</div>
              <div class="cube-face top">PRO</div>
              <div class="cube-face bottom">V2.0</div>
            </div>
            <div class="logo-glow"></div>
          </div>
          <div class="logo-title">
            <span class="title-part">DATABASE</span>
            <span class="title-highlight">ADMIN</span>
            <span class="title-part">SYSTEM</span>
          </div>
          <div class="logo-subtitle">QUANTUM DATA PLATFORM</div>
        </div>

        <!-- 登录表单 -->
        <div class="login-form">
          <!-- 用户名输入 -->
          <div class="input-field">
            <div class="input-label">
              <span class="label-text">USER IDENTITY</span>
              <span class="label-indicator"></span>
            </div>
            <div class="input-container" :class="{ 'input-active': usernameActive }">
              <div class="input-icon">
                <div class="icon-scan"></div>
              </div>
              <input
                v-model="loginForm.username"
                type="text"
                placeholder="ENTER USERNAME"
                class="tech-input"
                @focus="usernameActive = true"
                @blur="usernameActive = false"
              />
              <div class="input-line"></div>
              <div class="input-effects">
                <div class="effect-pulse"></div>
                <div class="effect-scan"></div>
              </div>
            </div>
          </div>

          <!-- 密码输入 -->
          <div class="input-field">
            <div class="input-label">
              <span class="label-text">ACCESS CODE</span>
              <span class="label-indicator"></span>
            </div>
            <div class="input-container" :class="{ 'input-active': passwordActive }">
              <div class="input-icon">
                <div class="icon-lock"></div>
              </div>
              <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="ENTER PASSWORD"
                class="tech-input"
                @focus="passwordActive = true"
                @blur="passwordActive = false"
              />
              <button class="toggle-password" @click="showPassword = !showPassword">
                <div class="toggle-icon" :class="{ 'toggle-active': showPassword }"></div>
              </button>
              <div class="input-line"></div>
              <div class="input-effects">
                <div class="effect-pulse"></div>
                <div class="effect-scan"></div>
              </div>
            </div>
          </div>

          <!-- 验证码 -->
          <div class="captcha-field">
            <div class="input-label">
              <span class="label-text">SECURITY VERIFICATION</span>
              <span class="label-status">REQUIRED</span>
            </div>
            <div class="captcha-container">
              <div class="input-container" :class="{ 'input-active': captchaActive }">
                <div class="input-icon">
                  <div class="icon-shield"></div>
                </div>
                <input
                  v-model="loginForm.captchaCode"
                  placeholder="ENTER CAPTCHA"
                  class="tech-input"
                  @focus="captchaActive = true"
                  @blur="captchaActive = false"
                />
                <div class="input-line"></div>
                <div class="input-effects">
                  <div class="effect-pulse"></div>
                  <div class="effect-scan"></div>
                </div>
              </div>

              <!-- 验证码图片 -->
              <div class="captcha-display" @click="refreshCaptcha">
                <div class="captcha-bg">
                  <div class="captcha-grid"></div>
                  <div class="captcha-image" :style="{ backgroundImage: `url(${captchaImage})` }"></div>
                  <div class="captcha-overlay">
                    <div class="captcha-loader" v-if="captchaLoading">
                      <div class="loader-dot"></div>
                      <div class="loader-dot"></div>
                      <div class="loader-dot"></div>
                    </div>
                    <div class="captcha-refresh" v-else>
                      <div class="refresh-icon">
                        <div class="refresh-arrow"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="captcha-info">
                  <span class="info-key">KEY: {{ captchaKey }}</span>
                  <span class="info-hint">CLICK TO REFRESH</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 记住我 -->
          <div class="remember-field">
            <label class="tech-checkbox">
              <input
                type="checkbox"
                v-model="loginForm.remember"
                class="checkbox-input"
              />
              <span class="checkbox-custom">
                <span class="checkbox-inner"></span>
              </span>
              <span class="checkbox-label">REMEMBER CREDENTIALS</span>
            </label>
            <a href="#" class="forgot-link">RECOVER ACCESS</a>
          </div>

          <!-- 登录按钮 -->
          <button
            class="login-button"
            :class="{ 'login-loading': loginLoading }"
            @click="handleLogin"
            :disabled="loginLoading"
          >
            <div class="button-bg"></div>
            <div class="button-glow"></div>
            <div class="button-content">
              <div class="button-text">
                <span class="text-main">INITIATE</span>
                <span class="text-sub">ACCESS SEQUENCE</span>
              </div>
              <div class="button-icon">
                <div class="icon-arrow"></div>
              </div>
            </div>
            <div class="button-loader" v-if="loginLoading">
              <div class="loader-circle"></div>
            </div>
          </button>

          <!-- 系统信息 -->
          <div class="system-info">
            <div class="info-item">
              <div class="info-icon">🛡️</div>
              <div class="info-text">256-BIT ENCRYPTION</div>
            </div>
            <div class="info-item">
              <div class="info-icon">⚡</div>
              <div class="info-text">ULTRA LOW LATENCY</div>
            </div>
            <div class="info-item">
              <div class="info-icon">🔒</div>
              <div class="info-text">MILITARY GRADE SECURITY</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="status-bar">
        <div class="status-item">
          <span class="status-label">SYSTEM</span>
          <span class="status-value">ONLINE</span>
          <div class="status-indicator active"></div>
        </div>
        <div class="status-item">
          <span class="status-label">DATABASE</span>
          <span class="status-value">CONNECTED</span>
          <div class="status-indicator active"></div>
        </div>
        <div class="status-item">
          <span class="status-label">ENCRYPTION</span>
          <span class="status-value">ACTIVE</span>
          <div class="status-indicator active"></div>
        </div>
        <div class="status-item">
          <span class="status-label">TIME</span>
          <span class="status-value">{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- 登录成功全息投影 -->
    <transition name="hologram-fade">
      <div class="hologram-success" v-if="showSuccess">
        <div class="hologram-content">
          <div class="success-3d">
            <div class="cube-3d">
              <div class="cube-side front">✓</div>
              <div class="cube-side back"></div>
              <div class="cube-side right"></div>
              <div class="cube-side left"></div>
              <div class="cube-side top"></div>
              <div class="cube-side bottom"></div>
            </div>
          </div>
          <div class="success-text">
            <div class="text-line">ACCESS GRANTED</div>
            <div class="text-line">INITIALIZING DATABASE INTERFACE</div>
          </div>
          <div class="success-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <div class="progress-text">{{ progress }}% COMPLETE</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { dbApi } from '../api/index.js'  // 修复导入路径

const router = useRouter()
const particlesContainer = ref(null)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  captchaKey: '',
  captchaCode: '',
  remember: false
})

// 状态变量
const usernameActive = ref(false)
const passwordActive = ref(false)
const captchaActive = ref(false)
const showPassword = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')
const captchaLoading = ref(false)
const loginLoading = ref(false)
const showSuccess = ref(false)
const progress = ref(0)
const currentTime = ref('')

// 数据流动画数据
const dataStreams = ref([])

// 生成数据流
const generateDataStreams = () => {
  const streams = []
  for (let i = 0; i < 15; i++) {
    streams.push({
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 7,
      text: generateBinaryText()
    })
  }
  dataStreams.value = streams
}

// 生成二进制文本
const generateBinaryText = () => {
  const length = 8 + Math.floor(Math.random() * 8)
  let binary = ''
  for (let i = 0; i < length; i++) {
    binary += Math.random() > 0.5 ? '1' : '0'
  }
  return binary
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取验证码
const refreshCaptcha = async () => {
  captchaLoading.value = true
  try {
    const response = await dbApi.getCaptcha()
    if (response.success) {
      captchaImage.value = response.result.captchaImage
      captchaKey.value = response.result.captchaKey
      loginForm.captchaKey = response.result.captchaKey
    }
  } catch (error) {
    ElMessage.error('SECURITY VERIFICATION FAILED')
  } finally {
    captchaLoading.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password || !loginForm.captchaCode) {
    ElMessage.error('PLEASE COMPLETE ALL FIELDS')
    return
  }

  loginLoading.value = true

  try {
    const response = await dbApi.login({
      username: loginForm.username,
      password: loginForm.password,
      captchaKey: loginForm.captchaKey,
      captchaCode: loginForm.captchaCode
    })
    if (response.success) {
      // 存储token
      localStorage.setItem('token', response.result.token)
      localStorage.setItem('userInfo', JSON.stringify(response.result))

      // 显示成功动画
      showSuccess.value = true

      // 模拟加载进度
      const interval = setInterval(() => {
        if (progress.value < 100) {
          progress.value += 10
        } else {
          clearInterval(interval)
          setTimeout(() => {
            router.push('/tables')
          }, 500)
        }
      }, 100)
    } else {
      ElMessage.error(response.message || 'ACCESS DENIED')
      refreshCaptcha()
    }
  } catch (error) {
    ElMessage.error(error.message || 'SYSTEM ERROR')
    refreshCaptcha()
  } finally {
    loginLoading.value = false
  }
}

// 初始化粒子效果
const initParticles = () => {
  const container = particlesContainer.value
  if (!container) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  container.appendChild(canvas)

  const resizeCanvas = () => {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const particles = []
  const particleCount = 150

  // 创建粒子
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1,
      color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 255)}, 255, 0.5)`
    })
  }

  // 动画循环
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => {
      // 3D效果：根据z坐标调整大小和速度
      const scale = 0.5 + p.z / 200
      const speed = p.speed * scale

      p.x += speed
      p.y += Math.sin(p.x * 0.01) * 0.3

      if (p.x > canvas.width) {
        p.x = 0
        p.y = Math.random() * canvas.height
      }

      // 绘制粒子
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()

      // 绘制粒子轨迹
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - speed * 5, p.y - speed * 5)
      ctx.strokeStyle = p.color.replace('0.5', '0.2')
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    requestAnimationFrame(animate)
  }

  animate()

  return () => {
    window.removeEventListener('resize', resizeCanvas)
  }
}

// 初始化
onMounted(() => {
  // 初始化效果
  generateDataStreams()
  initParticles()
  refreshCaptcha()

  // 更新时间
  updateTime()
  const timeInterval = setInterval(updateTime, 1000)

  // 检查记住的用户
  const rememberedUser = localStorage.getItem('rememberedUser')
  if (rememberedUser) {
    loginForm.username = rememberedUser
    loginForm.remember = true
  }

  // 清理
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0e17 0%, #0c1220 50%, #0a0e17 100%);
  overflow: hidden;
  font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
}

/* 3D粒子背景 */
.particles-3d {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.6;
}

/* 全息投影效果 */
.hologram-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.hologram-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, #00f2fe, transparent);
  height: 1px;
  animation: scan 3s linear infinite;
}

.hologram-line.line-1 { top: 20%; width: 100%; animation-delay: 0s; }
.hologram-line.line-2 { top: 50%; width: 100%; animation-delay: 1s; }
.hologram-line.line-3 { top: 80%; width: 100%; animation-delay: 2s; }

.hologram-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 242, 254, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 254, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridShift 10s linear infinite;
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes gridShift {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

/* 动态数据流 */
.data-stream {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.stream-item {
  position: absolute;
  font-size: 12px;
  color: #00f2fe;
  text-shadow: 0 0 5px #00f2fe;
  animation: streamFall linear infinite;
  opacity: 0.7;
}

@keyframes streamFall {
  0% {
    transform: translateY(-100px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 登录面板 */
.login-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  background: rgba(20, 25, 40, 0.85);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 242, 254, 0.3);
  border-radius: 15px;
  z-index: 10;
  overflow: hidden;
  box-shadow:
    0 0 50px rgba(0, 242, 254, 0.3),
    inset 0 0 20px rgba(0, 242, 254, 0.1);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f2fe, transparent);
  animation: scanLine 3s linear infinite;
  z-index: 1;
}

@keyframes scanLine {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

.panel-main {
  padding: 40px;
}

/* 全息Logo */
.holographic-logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo-base {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.logo-cube {
  width: 80px;
  height: 80px;
  position: relative;
  transform-style: preserve-3d;
  animation: cubeRotate 20s infinite linear;
}

.cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f2fe;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 0 5px #00f2fe;
}

.cube-face.front { transform: translateZ(40px); }
.cube-face.back { transform: translateZ(-40px) rotateY(180deg); }
.cube-face.right { transform: rotateY(90deg) translateZ(40px); }
.cube-face.left { transform: rotateY(-90deg) translateZ(40px); }
.cube-face.top { transform: rotateX(90deg) translateZ(40px); }
.cube-face.bottom { transform: rotateX(-90deg) translateZ(40px); }

@keyframes cubeRotate {
  0% { transform: rotateX(0) rotateY(0); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 70%);
  filter: blur(10px);
}

.logo-title {
  margin-bottom: 10px;
}

.title-part {
  color: #8a9ba8;
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 2px;
}

.title-highlight {
  color: #00f2fe;
  font-size: 24px;
  font-weight: 700;
  margin: 0 10px;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
}

.logo-subtitle {
  color: #4facfe;
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
}

/* 登录表单 */
.login-form {
  max-width: 400px;
  margin: 0 auto;
}

.input-field, .captcha-field {
  margin-bottom: 25px;
}

.input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label-text {
  color: #8a9ba8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.label-indicator {
  width: 8px;
  height: 8px;
  background: #00f2fe;
  border-radius: 50%;
  box-shadow: 0 0 5px #00f2fe;
  animation: pulse 1.5s infinite;
}

.label-status {
  color: #ff4757;
  font-size: 10px;
  text-transform: uppercase;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.input-container {
  position: relative;
  background: rgba(30, 35, 50, 0.5);
  border: 1px solid rgba(0, 242, 254, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  transition: all 0.3s ease;
}

.input-container.input-active {
  border-color: #00f2fe;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.2);
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
}

.icon-scan, .icon-lock, .icon-shield {
  width: 100%;
  height: 100%;
  background: #00f2fe;
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
}

.icon-scan { mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 3H4v3h2V5h1V3zM17 3h1v2h2v3h3V3h-3v2h-2V3zM7 21H4v-3h2v2h1v1zM17 21v-1h2v-2h3v3h-3v-2h-2zM19 12c0-3.9-3.1-7-7-7s-7 3.1-7 7 3.1 7 7 7 7-3.1 7-7z'/%3E%3C/svg%3E"); }
.icon-lock { mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-2.3 1.8-4.1 4.1-4.1 2.3 0 4.1 1.8 4.1 4.1v2z'/%3E%3C/svg%3E"); }
.icon-shield { mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4z'/%3E%3C/svg%3E"); }

.tech-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  padding-left: 35px;
  outline: none;
}

.tech-input::placeholder {
  color: #5d6c79;
  font-style: italic;
}

.toggle-password {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  width: 20px;
  height: 20px;
  cursor: pointer;
  padding: 0;
}

.toggle-icon {
  width: 100%;
  height: 100%;
  background: #8a9ba8;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 9c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm0-5c5.5 0 10 4.5 10 10 0 2.3-.8 4.4-2.1 6.1l-1.5-1.5c1-1.3 1.6-2.9 1.6-4.6 0-4.4-3.6-8-8-8-1.7 0-3.3.5-4.6 1.6L5.9 5.9C7.6 4.8 9.7 4 12 4zM2 4.3l2.3 2.3C3.2 7.6 2 9.7 2 12c0 5.5 4.5 10 10 10 2.3 0 4.4-.8 6.1-2.1l2.3 2.3 1.4-1.4L3.4 2.9 2 4.3z'/%3E%3C/svg%3E");
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
  transition: all 0.3s ease;
}

.toggle-icon.toggle-active {
  background: #00f2fe;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 6c3.8 0 7 3.1 7 7 0 .8-.1 1.5-.4 2.2l2.1 2.1c.8-1.3 1.3-2.8 1.3-4.3 0-4.4-3.6-8-8-8-1.5 0-2.9.4-4.1 1.1l1.5 1.5c.7-.3 1.5-.5 2.6-.5zm-6.1-1.9L1 4.3l2.3 2.3C2.4 8.4 2 10.1 2 12c0 5.5 4.5 10 10 10 1.9 0 3.7-.5 5.3-1.4l2.3 2.3 1.4-1.4-16-16-1.4 1.4zM12 16c-2.2 0-4-1.8-4-4 0-.6.1-1.2.3-1.7l5.4 5.4c-.5.2-1.1.3-1.7.3z'/%3E%3C/svg%3E");
}

.input-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00f2fe, transparent);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.input-container.input-active .input-line {
  transform: scaleX(1);
}

.input-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.effect-pulse, .effect-scan {
  position: absolute;
  background: #00f2fe;
  opacity: 0;
}

.effect-pulse {
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  animation: inputPulse 2s infinite;
}

.effect-scan {
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  animation: inputScan 3s infinite;
}

@keyframes inputPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
  50% { opacity: 0.05; }
}

@keyframes inputScan {
  0% { left: -100%; opacity: 0; }
  50% { opacity: 0.1; }
  100% { left: 100%; opacity: 0; }
}

/* 验证码区域 */
.captcha-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.captcha-display {
  position: relative;
  width: 140px;
  flex-shrink: 0;
  cursor: pointer;
}

.captcha-bg {
  position: relative;
  width: 100%;
  height: 60px;
  background: rgba(30, 35, 50, 0.8);
  border: 1px solid rgba(0, 242, 254, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.captcha-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 242, 254, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 254, 0.1) 1px, transparent 1px);
  background-size: 10px 10px;
}

.captcha-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.captcha-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 25, 40, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.captcha-bg:hover .captcha-overlay {
  opacity: 1;
}

.captcha-loader, .captcha-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-dot {
  width: 6px;
  height: 6px;
  background: #00f2fe;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out;
}

.loader-dot:nth-child(1) { animation-delay: -0.32s; }
.loader-dot:nth-child(2) { animation-delay: -0.16s; }

.refresh-icon {
  width: 24px;
  height: 24px;
  position: relative;
}

.refresh-arrow {
  width: 100%;
  height: 100%;
  background: #00f2fe;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'/%3E%3C/svg%3E");
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
}

.captcha-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 10px;
}

.info-key {
  color: #8a9ba8;
}

.info-hint {
  color: #4facfe;
}

/* 记住我 */
.remember-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 0;
}

.tech-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  position: relative;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(0, 242, 254, 0.5);
  border-radius: 4px;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.checkbox-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 10px;
  height: 10px;
  background: #00f2fe;
  border-radius: 2px;
  transition: transform 0.3s ease;
}

.checkbox-input:checked + .checkbox-custom {
  border-color: #00f2fe;
  box-shadow: 0 0 5px rgba(0, 242, 254, 0.5);
}

.checkbox-input:checked + .checkbox-custom .checkbox-inner {
  transform: translate(-50%, -50%) scale(1);
}

.checkbox-label {
  color: #8a9ba8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.forgot-link {
  color: #4facfe;
  font-size: 12px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #00f2fe;
}

/* 登录按钮 */
.login-button {
  position: relative;
  width: 100%;
  height: 60px;
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 30px;
}

.login-button:hover:not(:disabled) {
  background: rgba(0, 242, 254, 0.2);
  border-color: #00f2fe;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-loading {
  background: rgba(0, 242, 254, 0.05);
  border-color: rgba(0, 242, 254, 0.1);
}

.button-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(0, 242, 254, 0.1) 50%,
    transparent 100%);
  transform: translateX(-100%);
  animation: buttonShine 3s infinite;
}

@keyframes buttonShine {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

.button-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 70%);
  transition: all 0.5s ease;
}

.login-button:hover .button-glow {
  width: 200px;
  height: 200px;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.button-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.text-main {
  color: #00f2fe;
  font-size: 16px;
}

.text-sub {
  color: #8a9ba8;
  font-size: 10px;
  margin-top: 2px;
}

.button-icon {
  width: 20px;
  height: 20px;
}

.icon-arrow {
  width: 100%;
  height: 100%;
  background: #00f2fe;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'/%3E%3C/svg%3E");
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
  transition: transform 0.3s ease;
}

.login-button:hover .icon-arrow {
  transform: translateX(5px);
}

.button-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.loader-circle {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 242, 254, 0.3);
  border-top-color: #00f2fe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 系统信息 */
.system-info {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid rgba(0, 242, 254, 0.1);
  padding-top: 20px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 14px;
}

.info-text {
  color: #5d6c79;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 底部状态栏 */
.status-bar {
  display: flex;
  justify-content: space-around;
  background: rgba(10, 14, 23, 0.8);
  border-top: 1px solid rgba(0, 242, 254, 0.2);
  padding: 10px 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #8a9ba8;
  font-size: 10px;
  text-transform: uppercase;
}

.status-value {
  color: #00f2fe;
  font-size: 11px;
  font-weight: bold;
}

.status-indicator {
  width: 6px;
  height: 6px;
  background: #ff4757;
  border-radius: 50%;
}

.status-indicator.active {
  background: #43e97b;
  box-shadow: 0 0 5px #43e97b;
  animation: indicatorPulse 1.5s infinite;
}

@keyframes indicatorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 登录成功全息投影 */
.hologram-success {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 14, 23, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.hologram-fade-enter-active, .hologram-fade-leave-active {
  transition: opacity 0.5s ease;
}

.hologram-fade-enter-from, .hologram-fade-leave-to {
  opacity: 0;
}

.hologram-content {
  text-align: center;
  max-width: 400px;
  animation: hologramAppear 1s ease;
}

@keyframes hologramAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-3d {
  margin-bottom: 30px;
}

.cube-3d {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  position: relative;
  transform-style: preserve-3d;
  animation: successRotate 10s infinite linear;
}

.cube-side {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f2fe;
  font-size: 24px;
  font-weight: bold;
}

.cube-side.front { transform: translateZ(40px); }
.cube-side.back { transform: translateZ(-40px) rotateY(180deg); }
.cube-side.right { transform: rotateY(90deg) translateZ(40px); }
.cube-side.left { transform: rotateY(-90deg) translateZ(40px); }
.cube-side.top { transform: rotateX(90deg) translateZ(40px); }
.cube-side.bottom { transform: rotateX(-90deg) translateZ(40px); }

@keyframes successRotate {
  0% { transform: rotateX(0) rotateY(0); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.success-text {
  margin-bottom: 30px;
}

.text-line {
  color: #00f2fe;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 10px 0;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
}

.success-progress {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 242, 254, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShine 1s infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  color: #8a9ba8;
  font-size: 12px;
  letter-spacing: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-panel {
    width: 95%;
  }

  .panel-main {
    padding: 20px;
  }

  .captcha-container {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-display {
    width: 100%;
    height: 80px;
  }

  .system-info {
    flex-direction: column;
    gap: 15px;
  }

  .status-bar {
    flex-wrap: wrap;
    gap: 15px;
  }
}
</style>