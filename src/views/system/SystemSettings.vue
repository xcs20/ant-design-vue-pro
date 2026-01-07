<template>
  <page-header-wrapper>
    <a-card :bordered="false" :loading="loading">
      <a-form :form="form" layout="vertical">
        <a-divider>基础</a-divider>
        <a-form-item label="系统名称">
          <a-input v-decorator="['system_name']" placeholder="可选，留空不改" />
        </a-form-item>
        <a-form-item label="系统 Logo">
          <a-input v-decorator="['system_logo']" placeholder="粘贴图片地址，或使用下方上传" />
          <div style="margin-top: 8px">
            <a-upload :showUploadList="false" :customRequest="handleUpload">
              <a-button icon="upload">上传图片</a-button>
            </a-upload>
            <small style="margin-left: 8px">支持上传图片文件，建议 2MB 内</small>
          </div>
          <div v-if="form.getFieldValue('system_logo')" style="margin-top: 8px">
            <a-avatar :src="form.getFieldValue('system_logo')" shape="square" :size="64" />
            <span style="margin-left: 8px">{{ form.getFieldValue('system_logo') }}</span>
          </div>
        </a-form-item>

        <a-divider>密码复杂度</a-divider>
        <a-row :gutter="12">
          <a-col :md="8" :sm="24">
            <a-form-item label="最小长度">
              <a-input-number
                v-decorator="['password_min_length', { initialValue: 8 }]"
                :min="6"
                :max="128"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :md="8" :sm="24">
            <a-form-item label="必须包含大写字母">
              <a-switch v-decorator="['password_require_uppercase', { valuePropName: 'checked', initialValue: false }]" />
            </a-form-item>
          </a-col>
          <a-col :md="8" :sm="24">
            <a-form-item label="必须包含小写字母">
              <a-switch v-decorator="['password_require_lowercase', { valuePropName: 'checked', initialValue: false }]" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :md="8" :sm="24">
            <a-form-item label="必须包含数字">
              <a-switch v-decorator="['password_require_digit', { valuePropName: 'checked', initialValue: false }]" />
            </a-form-item>
          </a-col>
          <a-col :md="8" :sm="24">
            <a-form-item label="必须包含特殊字符">
              <a-switch v-decorator="['password_require_special', { valuePropName: 'checked', initialValue: false }]" />
            </a-form-item>
          </a-col>
          <a-col :md="8" :sm="24">
            <a-form-item label="策略预览">
              <a-alert :message="policyPreview" type="info" showIcon />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>资产编号规则</a-divider>
        <a-row :gutter="12">
          <a-col :md="12" :sm="24">
            <a-form-item label="编号规则">
              <a-input
                v-decorator="[
                  'asset_tag_pattern',
                  { }
                ]"
                placeholder="如 AS{YYMMDD}{SEQ3}"
              />
              <small>占位符：{YYYY}{YY}{MM}{DD}{HH}{mm}{ss}{SEQ} 或 {SEQn}（n为位数）</small>
            </a-form-item>
          </a-col>
          <a-col :md="12" :sm="24">
            <a-form-item label="序列当前值">
              <a-input-number
                v-decorator="['asset_tag_seq']"
                :min="1"
                style="width: 100%"
              />
              <small>保存后生效，可重置为 1</small>
            </a-form-item>
          </a-col>
        </a-row>

        <div style="margin-top: 8px">
          <a-button v-if="$auth('system.update')" type="primary" :loading="saving" @click="handleSave">保存</a-button>
        </div>
      </a-form>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSystemSettings, updateSystemSetting, uploadSystemLogo } from '@/api/system'

export default {
  name: 'SystemSettings',
  data () {
    return {
      loading: false,
      saving: false,
      form: this.$form.createForm(this),
      setting: null
    }
  },
  computed: {
    policyPreview () {
      const values = this.form.getFieldsValue([
        'password_min_length',
        'password_require_uppercase',
        'password_require_lowercase',
        'password_require_digit',
        'password_require_special'
      ]) || {}
      const parts = [`长度 ≥ ${values.password_min_length || 8}`]
      if (values.password_require_uppercase) parts.push('大写字母')
      if (values.password_require_lowercase) parts.push('小写字母')
      if (values.password_require_digit) parts.push('数字')
      if (values.password_require_special) parts.push('特殊字符')
      return parts.join('，')
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      try {
        const data = await listSystemSettings({ page: 1 })
        const setting = (data.results || [])[0]
        this.setting = setting || null
        this.$nextTick(() => {
          this.form.resetFields()
          if (setting) {
            this.form.setFieldsValue({
              system_name: setting.system_name,
              system_logo: setting.system_logo,
              password_min_length: setting.password_min_length,
              password_require_uppercase: setting.password_require_uppercase,
              password_require_lowercase: setting.password_require_lowercase,
              password_require_digit: setting.password_require_digit,
              password_require_special: setting.password_require_special,
              asset_tag_pattern: setting.asset_tag_pattern,
              asset_tag_seq: setting.asset_tag_seq
            })
          }
        })
      } catch (e) {
        this.setting = null
        this.$notification.error({
          message: '错误',
          description: (e.response && e.response.data && e.response.data.detail) || e.message || '加载失败'
        })
      } finally {
        this.loading = false
      }
    },
    async handleUpload ({ file, onError, onSuccess }) {
      if (!this.setting) {
        onError(new Error('未加载到系统设置'))
        return
      }
      try {
        const res = await uploadSystemLogo(this.setting.id, file)
        const url = res.url || res.path || ''
        if (url) {
          this.form.setFieldsValue({ system_logo: url })
          this.$message.success('上传成功')
          onSuccess(res, file)
        } else {
          throw new Error('上传结果为空')
        }
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '上传失败', description: detail })
        onError(e)
      }
    },
    handleSave () {
      if (!this.setting) return
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.saving = true
        try {
          const updated = await updateSystemSetting(this.setting.id, values)
          this.setting = updated
          if (updated && updated.system_name) {
            this.$store.commit('SET_SITE_TITLE', updated.system_name)
          }
          this.$message.success('已保存')
        } catch (e) {
          const data = (e.response && e.response.data) || {}
          const detail = data.detail || data.message || JSON.stringify(data)
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>
