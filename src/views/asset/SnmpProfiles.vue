<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="名称/用户名/备注" />
              </a-form-item>
            </a-col>
            <a-col :md="16" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button v-if="$auth('snmp.add')" type="primary" icon="plus" @click="openCreate">新建</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 980 }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('snmp.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('snmp.update') && $auth('snmp.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('snmp.delete')" title="确认删除该配置？" @confirm="() => handleDelete(record)">
            <a style="color: #ff4d4f">删除</a>
          </a-popconfirm>
        </template>
      </a-table>

      <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleSubmit"
        @cancel="handleCancel"
        width="760px"
      >
        <a-form :form="form" layout="vertical">
          <a-form-item label="配置名称">
            <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入配置名称' }] }]" />
          </a-form-item>

          <a-form-item label="版本">
            <a-select
              v-decorator="[
                'version',
                { initialValue: 'v2c', rules: [{ required: true, message: '请选择版本' }] }
              ]"
              @change="onVersionChange"
              style="max-width: 240px"
            >
              <a-select-option value="v1">v1</a-select-option>
              <a-select-option value="v2c">v2c</a-select-option>
              <a-select-option value="v3">v3</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item v-if="!isV3" label="Community">
            <a-input
              v-decorator="['community']"
              :placeholder="isEditing ? '留空表示不修改' : '请输入 community'"
            />
          </a-form-item>

          <template v-if="isV3">
            <a-divider>SNMPv3</a-divider>

            <a-form-item label="Security Level">
              <a-select
                v-decorator="[
                  'security_level',
                  { initialValue: 'noAuthNoPriv', rules: [{ required: true, message: '请选择 Security Level' }] }
                ]"
                @change="onSecurityLevelChange"
                style="max-width: 240px"
              >
                <a-select-option value="noAuthNoPriv">noAuthNoPriv</a-select-option>
                <a-select-option value="authNoPriv">authNoPriv</a-select-option>
                <a-select-option value="authPriv">authPriv</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="用户名">
              <a-input v-decorator="['username']" />
            </a-form-item>

            <a-form-item v-if="needsAuth" label="Auth Protocol">
              <a-select v-decorator="['auth_protocol']" allowClear style="max-width: 240px">
                <a-select-option value="MD5">MD5</a-select-option>
                <a-select-option value="SHA">SHA</a-select-option>
                <a-select-option value="SHA224">SHA224</a-select-option>
                <a-select-option value="SHA256">SHA256</a-select-option>
                <a-select-option value="SHA384">SHA384</a-select-option>
                <a-select-option value="SHA512">SHA512</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item v-if="needsAuth" label="Auth Password">
              <a-input
                v-decorator="['auth_password']"
                :placeholder="isEditing ? '留空表示不修改' : '请输入 Auth Password'"
              />
            </a-form-item>

            <a-form-item v-if="needsPriv" label="Priv Protocol">
              <a-select v-decorator="['priv_protocol']" allowClear style="max-width: 240px">
                <a-select-option value="DES">DES</a-select-option>
                <a-select-option value="AES">AES</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item v-if="needsPriv" label="Priv Password">
              <a-input
                v-decorator="['priv_password']"
                :placeholder="isEditing ? '留空表示不修改' : '请输入 Priv Password'"
              />
            </a-form-item>
          </template>

          <a-divider>连接参数</a-divider>
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="默认端口">
                <a-input-number
                  v-decorator="['default_port', { initialValue: 161 }]"
                  :min="1"
                  :max="65535"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="超时(秒)">
                <a-input-number
                  v-decorator="['timeout_seconds', { initialValue: 2 }]"
                  :min="1"
                  :max="60"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="重试次数">
                <a-input-number
                  v-decorator="['retries', { initialValue: 1 }]"
                  :min="0"
                  :max="10"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="启用">
            <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
          </a-form-item>

          <a-form-item label="备注">
            <a-textarea v-decorator="['description']" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { createSnmpProfile, deleteSnmpProfile, listSnmpProfiles, updateSnmpProfile } from '@/api/cmdb'

export default {
  name: 'SnmpProfiles',
  data () {
    return {
      query: { q: '' },
      loading: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: '名称', dataIndex: 'name', key: 'name', width: 220 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 90 },
        { title: 'v3 Level', dataIndex: 'security_level', key: 'security_level', width: 140 },
        { title: 'v3 用户名', dataIndex: 'username', key: 'username', width: 140 },
        { title: '端口', dataIndex: 'default_port', key: 'default_port', width: 80 },
        { title: '启用', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建 SNMP 配置',
      editing: null,
      currentVersion: 'v2c',
      currentSecurityLevel: 'noAuthNoPriv',
      form: this.$form.createForm(this)
    }
  },
  computed: {
    isEditing () {
      return !!this.editing
    },
    isV3 () {
      return this.currentVersion === 'v3'
    },
    needsAuth () {
      return this.isV3 && ['authNoPriv', 'authPriv'].includes(this.currentSecurityLevel)
    },
    needsPriv () {
      return this.isV3 && this.currentSecurityLevel === 'authPriv'
    }
  },
  created () {
    this.fetch(1)
  },
  methods: {
    async fetch (page) {
      this.loading = true
      try {
        const data = await listSnmpProfiles({ page, q: this.query.q })
        this.dataSource = data.results || []
        this.pagination.total = data.count || 0
        this.pagination.current = page
      } catch (e) {
        this.$notification.error({
          message: '错误',
          description: (e.response && e.response.data && e.response.data.detail) || e.message || '加载失败'
        })
      } finally {
        this.loading = false
      }
    },
    reset () {
      this.query.q = ''
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建 SNMP 配置'
      this.modalVisible = true
      this.currentVersion = 'v2c'
      this.currentSecurityLevel = 'noAuthNoPriv'
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          version: 'v2c',
          security_level: 'noAuthNoPriv',
          default_port: 161,
          timeout_seconds: 2,
          retries: 1,
          is_active: true
        })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑 SNMP 配置'
      this.modalVisible = true
      this.currentVersion = record.version
      this.currentSecurityLevel = record.security_level || 'noAuthNoPriv'
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          name: record.name,
          version: record.version,
          security_level: record.security_level,
          username: record.username,
          auth_protocol: record.auth_protocol,
          priv_protocol: record.priv_protocol,
          default_port: record.default_port,
          timeout_seconds: record.timeout_seconds,
          retries: record.retries,
          description: record.description,
          is_active: record.is_active
        })
      })
    },
    onVersionChange (value) {
      this.currentVersion = value
      if (value !== 'v3') {
        this.currentSecurityLevel = 'noAuthNoPriv'
      }
    },
    onSecurityLevelChange (value) {
      this.currentSecurityLevel = value
    },
    handleCancel () {
      this.modalVisible = false
    },
    handleSubmit () {
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.modalLoading = true
        try {
          const payload = { ...values }
          if (payload.version !== 'v3') {
            delete payload.security_level
            delete payload.username
            delete payload.auth_protocol
            delete payload.auth_password
            delete payload.priv_protocol
            delete payload.priv_password
          } else {
            delete payload.community
          }

          if (this.isEditing) {
            ;['community', 'auth_password', 'priv_password'].forEach((key) => {
              if (payload[key] === '') delete payload[key]
            })
            await updateSnmpProfile(this.editing.id, payload)
            this.$message.success('已保存')
          } else {
            await createSnmpProfile(payload)
            this.$message.success('已创建')
          }
          this.modalVisible = false
          this.fetch(this.pagination.current)
        } catch (e) {
          const data = (e.response && e.response.data) || {}
          const detail = data.detail || data.message || JSON.stringify(data)
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.modalLoading = false
        }
      })
    },
    async handleDelete (record) {
      try {
        await deleteSnmpProfile(record.id)
        this.$message.success('已删除')
        this.fetch(this.pagination.current)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    }
  }
}
</script>

<style lang="less" scoped>
.table-operator {
  margin-bottom: 12px;
}
</style>
