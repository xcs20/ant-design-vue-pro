<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="标识/名称/描述" />
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
        <a-button v-if="$auth('role.add')" type="primary" icon="plus" @click="openCreate">新建角色</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1100 }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="is_builtin" slot-scope="text, record">
          <a-tag v-if="record.is_builtin" color="blue">内置</a-tag>
          <a-tag v-else>自定义</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('role.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('role.update') && $auth('role.delete')" type="vertical" />
          <a-popconfirm
            v-if="$auth('role.delete')"
            :disabled="record.is_builtin"
            :title="record.is_builtin ? '内置角色不允许删除' : '确认删除该角色？'"
            @confirm="() => handleDelete(record)"
          >
            <a :style="record.is_builtin ? 'color:#bfbfbf; cursor:not-allowed' : 'color:#ff4d4f'">删除</a>
          </a-popconfirm>
        </template>
      </a-table>

      <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleSubmit"
        @cancel="handleCancel"
        width="980px"
      >
        <a-form :form="form" layout="vertical">
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="角色标识（code）">
                <a-input
                  v-decorator="['code', { rules: [{ required: true, message: '请输入角色标识' }] }]"
                  :disabled="isEditing"
                  placeholder="例如：admin / operator / readonly"
                />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="角色名称">
                <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入角色名称' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="启用">
                <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="描述">
            <a-textarea v-decorator="['description']" :rows="2" />
          </a-form-item>

          <a-divider>权限分配</a-divider>
          <a-table
            :columns="permissionColumns"
            :dataSource="permissions"
            :pagination="false"
            :scroll="{ x: 1040 }"
            rowKey="code"
            size="small"
          >
            <template slot="actions" slot-scope="text, record">
              <a-checkbox-group
                :value="permissionActions[record.code] || []"
                :options="actionOptions"
                @change="(vals) => onPermissionActionsChange(record.code, vals)"
              />
            </template>
          </a-table>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { createRole, deleteRole, listPermissions, listRoles, updateRole } from '@/api/rbac'

export default {
  name: 'Roles',
  data () {
    return {
      query: { q: '', is_active: undefined },
      loading: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: '标识', dataIndex: 'code', key: 'code', width: 160 },
        { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 360 },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '类型', dataIndex: 'is_builtin', key: 'is_builtin', width: 90, scopedSlots: { customRender: 'is_builtin' } },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建角色',
      editing: null,
      form: this.$form.createForm(this),
      permissions: [],
      permissionActions: {},
      actionOptions: [
        { label: '新增', value: 'add' },
        { label: '查询', value: 'query' },
        { label: '详情', value: 'get' },
        { label: '修改', value: 'update' },
        { label: '删除', value: 'delete' }
      ],
      permissionColumns: [
        { title: '权限标识', dataIndex: 'code', key: 'code', width: 160 },
        { title: '权限名称', dataIndex: 'name', key: 'name', width: 160 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 300 },
        { title: '动作', key: 'actions', width: 420, scopedSlots: { customRender: 'actions' } }
      ]
    }
  },
  computed: {
    isEditing () {
      return !!this.editing
    }
  },
  created () {
    this.bootstrap()
  },
  methods: {
    async bootstrap () {
      await Promise.all([this.fetch(1), this.fetchPermissions()])
    },
    async fetchPermissions () {
      try {
        const data = await listPermissions({ page: 1 })
        this.permissions = data.results || []
      } catch (e) {
        this.permissions = []
      }
    },
    async fetch (page) {
      this.loading = true
      try {
        const params = { page, q: this.query.q }
        if (this.query.is_active === 0 || this.query.is_active === 1) {
          params.is_active = this.query.is_active
        }
        const data = await listRoles(params)
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
    onPermissionActionsChange (code, vals) {
      this.$set(this.permissionActions, code, vals || [])
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建角色'
      this.modalVisible = true
      this.permissionActions = {}
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          is_active: true
        })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑角色'
      this.modalVisible = true
      const mapping = {}
      ;(record.permissions || []).forEach((p) => {
        mapping[p.permission] = p.actions || []
      })
      this.permissionActions = mapping
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          code: record.code,
          name: record.name,
          description: record.description,
          is_active: record.is_active
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
          const permissionRules = Object.keys(this.permissionActions)
            .map((code) => ({ permission: code, actions: this.permissionActions[code] || [] }))
            .filter((rule) => (rule.actions || []).length > 0)

          const payload = { ...values, permission_rules: permissionRules }
          if (this.isEditing) {
            await updateRole(this.editing.id, payload)
            this.$message.success('已保存')
          } else {
            await createRole(payload)
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
      if (record.is_builtin) return
      try {
        await deleteRole(record.id)
        this.$message.success('已删除')
        this.fetch(this.pagination.current || 1)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    }
  }
}
</script>
