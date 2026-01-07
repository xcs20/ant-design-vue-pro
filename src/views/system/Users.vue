<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="用户名/邮箱/姓名" />
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="状态">
                <a-select v-model="query.is_active" allowClear placeholder="全部" style="width: 100%">
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="0">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="10" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button v-if="$auth('user.add')" type="primary" icon="plus" @click="openCreate">新建用户</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1600 }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="roles" slot-scope="text, record">
          <span v-if="(record.roles || []).length === 0">-</span>
          <a-tag v-for="r in (record.roles || [])" :key="r.id" color="geekblue">{{ r.name }}</a-tag>
        </template>
        <template slot="is_staff" slot-scope="text, record">
          <a-tag v-if="record.is_staff" color="blue">是</a-tag>
          <a-tag v-else>否</a-tag>
        </template>
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="last_login" slot-scope="text, record">
          <span v-if="record.last_login">{{ record.last_login | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="date_joined" slot-scope="text, record">
          <span v-if="record.date_joined">{{ record.date_joined | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('user.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('user.update')" type="vertical" />
          <a v-if="$auth('user.update')" @click="openResetPassword(record)">重置密码</a>
          <a-divider v-if="$auth('user.update') && $auth('user.delete')" type="vertical" />
          <a-popconfirm
            v-if="$auth('user.delete') && String(record.id) !== currentUserId"
            title="确认删除该用户？"
            @confirm="() => handleDelete(record)"
          >
            <a style="color: #ff4d4f">删除</a>
          </a-popconfirm>
          <a v-else-if="$auth('user.delete')" style="color: #bfbfbf; cursor: not-allowed">删除</a>
        </template>
      </a-table>

      <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleSubmit"
        @cancel="handleCancel"
        width="720px"
      >
        <a-form :form="form" layout="vertical">
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="用户名">
                <a-input v-decorator="['username', { rules: [{ required: true, message: '请输入用户名' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="邮箱">
                <a-input v-decorator="['email']" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="名">
                <a-input v-decorator="['first_name']" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="姓">
                <a-input v-decorator="['last_name']" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="密码">
            <a-input
              v-decorator="['password', { rules: passwordRules }]"
              type="password"
              :placeholder="isEditing ? '留空表示不修改' : '请输入密码'"
            />
          </a-form-item>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="启用">
                <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="后台管理员（is_staff）">
                <a-switch v-decorator="['is_staff', { valuePropName: 'checked', initialValue: false }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="角色">
            <a-select v-decorator="['role_ids', { initialValue: [] }]" mode="multiple" allowClear placeholder="请选择角色">
              <a-select-option v-for="r in roles" :key="r.id" :value="r.id">
                {{ r.name }}（{{ r.code }}）
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        title="重置密码"
        :visible="pwdModalVisible"
        :confirmLoading="pwdLoading"
        @ok="handleResetPassword"
        @cancel="handlePwdCancel"
        width="520px"
      >
        <a-form :form="pwdForm" layout="vertical">
          <a-form-item label="新密码">
            <a-input v-decorator="['password', { rules: [{ required: true, message: '请输入新密码' }] }]" type="password" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { createUser, deleteUser, listUsers, updateUser } from '@/api/users'
import { listRoles } from '@/api/rbac'

export default {
  name: 'Users',
  data () {
    return {
      query: { q: '', is_active: undefined },
      loading: false,
      dataSource: [],
      roles: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: '用户名', dataIndex: 'username', key: 'username', width: 160 },
        { title: '邮箱', dataIndex: 'email', key: 'email', width: 220 },
        { title: '角色', dataIndex: 'roles', key: 'roles', width: 220, scopedSlots: { customRender: 'roles' } },
        { title: '名', dataIndex: 'first_name', key: 'first_name', width: 120 },
        { title: '姓', dataIndex: 'last_name', key: 'last_name', width: 120 },
        { title: '管理员', dataIndex: 'is_staff', key: 'is_staff', width: 90, scopedSlots: { customRender: 'is_staff' } },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '最后登录', dataIndex: 'last_login', key: 'last_login', width: 180, scopedSlots: { customRender: 'last_login' } },
        { title: '创建时间', dataIndex: 'date_joined', key: 'date_joined', width: 180, scopedSlots: { customRender: 'date_joined' } },
        { title: '操作', key: 'actions', width: 220, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建用户',
      editing: null,
      form: this.$form.createForm(this),
      pwdModalVisible: false,
      pwdLoading: false,
      pwdUser: null,
      pwdForm: this.$form.createForm(this)
    }
  },
  computed: {
    isEditing () {
      return !!this.editing
    },
    currentUserId () {
      return String((this.$store.state.user && this.$store.state.user.info && this.$store.state.user.info.id) || '')
    },
    passwordRules () {
      if (this.isEditing) return []
      return [{ required: true, message: '请输入密码' }]
    }
  },
  created () {
    this.bootstrap()
  },
  methods: {
    async bootstrap () {
      await Promise.all([this.fetch(1), this.fetchRoles()])
    },
    async fetchRoles () {
      try {
        const data = await listRoles({ page: 1, is_active: 1 })
        this.roles = data.results || []
      } catch (e) {
        this.roles = []
      }
    },
    async fetch (page) {
      this.loading = true
      try {
        const params = { page, q: this.query.q }
        if (this.query.is_active === 0 || this.query.is_active === 1) {
          params.is_active = this.query.is_active
        }
        const data = await listUsers(params)
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
      this.query.is_active = undefined
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建用户'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          is_active: true,
          is_staff: false,
          role_ids: []
        })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑用户'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          username: record.username,
          email: record.email,
          first_name: record.first_name,
          last_name: record.last_name,
          is_active: record.is_active,
          is_staff: record.is_staff,
          role_ids: (record.roles || []).map(r => r.id),
          password: ''
        })
      })
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
          if (payload.password === '') delete payload.password
          if (this.isEditing) {
            await updateUser(this.editing.id, payload)
            this.$message.success('已保存')
          } else {
            await createUser(payload)
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
        await deleteUser(record.id)
        this.$message.success('已删除')
        const current = this.pagination.current || 1
        this.fetch(current)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    },
    openResetPassword (record) {
      this.pwdUser = record
      this.pwdModalVisible = true
      this.$nextTick(() => {
        this.pwdForm.resetFields()
      })
    },
    handlePwdCancel () {
      this.pwdModalVisible = false
      this.pwdUser = null
    },
    handleResetPassword () {
      this.pwdForm.validateFields(async (err, values) => {
        if (err) return
        this.pwdLoading = true
        try {
          await updateUser(this.pwdUser.id, { password: values.password })
          this.$message.success('密码已更新')
          this.pwdModalVisible = false
          this.pwdUser = null
        } catch (e) {
          const data = (e.response && e.response.data) || {}
          const detail = data.detail || data.message || JSON.stringify(data)
          this.$notification.error({ message: '重置失败', description: detail })
        } finally {
          this.pwdLoading = false
        }
      })
    }
  }
}
</script>
