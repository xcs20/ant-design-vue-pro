<template>
  <div class="main">
    <div class="login-card">
      <div class="login-header">
        <div class="badge">IPAM</div>
        <h2 class="title">{{ $store.state.user?.info?.system?.name || '资产安全运维平台' }}</h2>
        <p class="subtitle">颐点科技</p>
        <div class="accent-bar"></div>
      </div>
      <a-form
        id="formLogin"
        class="user-layout-login"
        ref="formLogin"
        :form="form"
        @submit="handleSubmit"
      >
        <a-alert v-if="isLoginError" type="error" showIcon style="margin-bottom: 24px;" :message="$t('user.login.message-invalid-credentials')" />

        <a-form-item>
          <a-input
            size="large"
            type="text"
            :placeholder="$t('user.login.username.placeholder')"
            v-decorator="[
              'username',
              {rules: [{ required: true, message: $t('user.userName.required') }, { validator: handleUsernameOrEmail }], validateTrigger: 'change'}
            ]"
          >
            <a-icon slot="prefix" type="user" :style="{ color: 'rgba(0,0,0,.25)' }"/>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-input-password
            size="large"
            :placeholder="$t('user.login.password.placeholder')"
            v-decorator="[
              'password',
              {rules: [{ required: true, message: $t('user.password.required') }], validateTrigger: 'blur'}
            ]"
          >
            <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-checkbox v-decorator="['rememberMe', { valuePropName: 'checked' }]">{{ $t('user.login.remember-me') }}</a-checkbox>
        </a-form-item>

        <a-form-item style="margin-top:24px">
          <a-button
            size="large"
            type="primary"
            htmlType="submit"
            class="login-button"
            :loading="state.loginBtn"
            :disabled="state.loginBtn"
          >{{ $t('user.login.login') }}</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { timeFix } from '@/utils/util'

export default {
  components: {},
  data () {
    return {
      isLoginError: false,
      form: this.$form.createForm(this),
      state: {
        loginBtn: false,
        loginType: 0
      }
    }
  },
  methods: {
    ...mapActions(['Login', 'Logout']),
    handleUsernameOrEmail (rule, value, callback) {
      const regex = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/
      this.state.loginType = regex.test(value) ? 0 : 1
      callback()
    },
    handleSubmit (e) {
      e.preventDefault()
      const { form: { validateFields }, state, Login } = this
      state.loginBtn = true
      validateFields(['username', 'password'], { force: true }, (err, values) => {
        if (!err) {
          Login(values)
            .then(() => this.loginSuccess())
            .catch(err => this.requestFailed(err))
            .finally(() => { state.loginBtn = false })
        } else {
          setTimeout(() => { state.loginBtn = false }, 600)
        }
      })
    },
    loginSuccess () {
      this.$router.push({ path: '/' })
      // 登录成功提示
      setTimeout(() => {
        this.$notification.success({
          message: '欢迎',
          description: `${timeFix()}，欢迎回来`
        })
      }, 500)
      this.isLoginError = false
    },
    requestFailed (err) {
      this.isLoginError = true
      this.$notification.error({
        message: '错误',
        description: ((err.response || {}).data || {}).message || '请求出现错误，请稍后再试',
        duration: 4
      })
    }
  }
}
</script>

<style lang="less" scoped>
.main {
  width: 100%;
  height: 100%;
  // min-height: 100vh;
  // display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0 24px;
}
.login-card {
  width: 420px;
  height: auto;
  max-width: 92vw;
  padding: 28px 28px 12px;
  border-radius: 16px;
  background: rgba(62, 129, 133, 0.75);
  border: 1px solid rgba(82, 196, 26, 0.3);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35), 0 0 60px rgba(64, 158, 255, 0.28);
  backdrop-filter: blur(10px);
}
.login-header {
  text-align: center;
  color: #151c1f;
  margin-bottom: 18px;
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, #52c41a, #1890ff);
    color: #0b1a2c;
    font-size: 12px;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
  .title {
    margin: 0;
    font-size: 22px;
    font-weight: 22px;
    letter-spacing: 0.5px;
  }
  .subtitle {
    margin: 6px 0 10px;
    color: rgba(230, 247, 255, 0.8);
    font-size: 13px;
  }
  .accent-bar {
    height: 3px;
    width: 120px;
    margin: 0 auto;
    background: linear-gradient(90deg, transparent, #52c41a, #1890ff, transparent);
    border-radius: 999px;
    box-shadow: 0 0 12px rgba(24, 144, 255, 0.5);
  }
}

.login-button {
  width: 100%;
  background: linear-gradient(90deg, #52c41a, #1890ff);
  border: none;
  box-shadow: 0 8px 20px rgba(82, 196, 26, 0.35);
}

/deep/ .ant-input,
/deep/ .ant-input-password {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  color: #e6f7ff;
}
/deep/ .ant-input::-webkit-input-placeholder {
  color: rgba(230, 247, 255, 0.6);
}
/deep/ .ant-input-affix-wrapper .anticon {
  color: #52c41a;
}

/deep/ .ant-checkbox-wrapper {
  color: #e6f7ff;
}

/deep/ .ant-alert {
  background: rgba(255, 77, 79, 0.08);
  border-color: rgba(255, 77, 79, 0.35);
  color: #fff;
}
</style>
