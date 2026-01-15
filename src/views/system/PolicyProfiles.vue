<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="名称/描述" />
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
        <a-button v-if="$auth('system.add')" type="primary" icon="plus" @click="openCreate">新建策略</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="oids" slot-scope="text, record">
          <a-tooltip :title="JSON.stringify(record.oids || {}, null, 2)">
            <span style="max-width: 280px; display: inline-block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
              {{ (record.oids && Object.keys(record.oids || {}).join(', ')) || '-' }}
            </span>
          </a-tooltip>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('system.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('system.update') && $auth('system.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('system.delete')" title="确认删除该策略？" @confirm="() => handleDelete(record)">
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
        width="820px"
      >
        <a-form :form="form" layout="vertical">
          <a-form-item label="策略名称">
            <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入策略名称' }] }]" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-decorator="['description']" :rows="2" />
          </a-form-item>
          <a-form-item label="OID 映射 (JSON)">
            <a-textarea
              v-decorator="['oids']"
              :rows="6"
              placeholder='如 {"action":"1.3.x.y","source":"1.3.x.z","mask":"...","remark":"..."}'
            />
            <small>对应 SNMP Agent /acl/apply 使用的 action/source/mask/remark 等 OID 前缀</small>
          </a-form-item>
          <a-form-item label="启用">
            <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listPolicyProfiles, createPolicyProfile, updatePolicyProfile, deletePolicyProfile } from '@/api/cmdb'

export default {
  name: 'PolicyProfiles',
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
        { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 260, ellipsis: true },
        { title: 'OID 映射', dataIndex: 'oids', key: 'oids', width: 220, scopedSlots: { customRender: 'oids' } },
        { title: '启用', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
        { title: '操作', key: 'actions', width: 140, scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建策略',
      editing: null,
      form: this.$form.createForm(this)
    }
  },
  computed: {
    isEditing () {
      return !!this.editing
    }
  },
  created () {
    this.fetch(1)
  },
  methods: {
    async fetch (page = 1) {
      this.loading = true
      try {
        const data = await listPolicyProfiles({ page, q: this.query.q })
        this.dataSource = data.results || []
        this.pagination.total = data.count || 0
        this.pagination.current = page
      } catch (e) {
        this.$notification.error({
          message: '加载失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
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
      this.modalTitle = '新建策略'
      this.modalVisible = true
      this.$nextTick(() => this.form.resetFields())
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑策略'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          name: record.name,
          description: record.description,
          oids: JSON.stringify(record.oids || {}, null, 2),
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
          let oidsVal = values.oids
          if (typeof oidsVal === 'string') {
            oidsVal = oidsVal.trim() ? JSON.parse(oidsVal) : {}
          }
          const payload = { ...values, oids: oidsVal }
          if (this.isEditing) {
            await updatePolicyProfile(this.editing.id, payload)
            this.$message.success('已更新')
          } else {
            await createPolicyProfile(payload)
            this.$message.success('已创建')
          }
          this.modalVisible = false
          this.fetch(this.pagination.current || 1)
        } catch (e) {
          const detail = (e.response && e.response.data && e.response.data.detail) || e.message
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.modalLoading = false
        }
      })
    },
    async handleDelete (record) {
      try {
        await deletePolicyProfile(record.id)
        this.$message.success('已删除')
        const currentPage = this.pagination.current || 1
        const nextPage = this.dataSource.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
        this.fetch(nextPage)
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '删除失败', description: detail })
      }
    }
  }
}
</script>
