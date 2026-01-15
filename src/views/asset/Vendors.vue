<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="10" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="厂商名称/联系人" />
              </a-form-item>
            </a-col>
            <a-col :md="14" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button v-if="$auth('vendor.add')" type="primary" icon="plus" @click="openCreate">新建厂商</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('vendor.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('vendor.update') && $auth('vendor.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('vendor.delete')" title="确认删除该厂商？" @confirm="() => handleDelete(record)">
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
        width="680px"
      >
        <a-form :form="form" layout="vertical">
          <a-form-item label="厂商名称">
            <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入厂商名称' }] }]" />
          </a-form-item>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="联系人">
                <a-input v-decorator="['contact_name']" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="联系电话">
                <a-input v-decorator="['contact_phone']" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="联系邮箱">
                <a-input v-decorator="['contact_email']" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="官网">
                <a-input v-decorator="['website']" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="备注">
            <a-textarea v-decorator="['notes']" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listVendors, createVendor, updateVendor, deleteVendor } from '@/api/cmdb'

export default {
  name: 'Vendors',
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
        { title: '厂商', dataIndex: 'name', key: 'name', width: 200 },
        { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 140 },
        { title: '电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 140 },
        { title: '邮箱', dataIndex: 'contact_email', key: 'contact_email', width: 200 },
        { title: '官网', dataIndex: 'website', key: 'website', width: 200 },
        { title: '备注', dataIndex: 'notes', key: 'notes' },
        { title: '操作', key: 'actions', width: 140, scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建厂商',
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
        const data = await listVendors({ page, q: this.query.q })
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
      this.modalTitle = '新建厂商'
      this.modalVisible = true
      this.$nextTick(() => this.form.resetFields())
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑厂商'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({ ...record })
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
          if (this.isEditing) {
            await updateVendor(this.editing.id, values)
          } else {
            await createVendor(values)
          }
          this.$message.success(this.isEditing ? '已更新' : '已创建')
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
        await deleteVendor(record.id)
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
