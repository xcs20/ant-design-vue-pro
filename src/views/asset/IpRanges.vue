<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="10" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="名称/CIDR/VLANif" />
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="启用状态">
                <a-select v-model="query.is_active" allowClear placeholder="全部" style="width: 160px">
                  <a-select-option value="true">启用</a-select-option>
                  <a-select-option value="false">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="fetch(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="reset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button v-if="$auth('ip-range.add')" type="primary" icon="plus" @click="openCreate">新建</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1280, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="usage_percent" slot-scope="text">
          <span>{{ Number(text || 0).toFixed(1) }}%</span>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a @click="handleFetchIp(record)">获取 IP</a>
          <a-divider type="vertical" />
          <a v-if="$auth('ip-range.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('ip-range.update') && $auth('ip-range.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('ip-range.delete')" title="确认删除该 IP 段？" @confirm="() => handleDelete(record)">
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
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="名称">
                <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入名称' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="IP 段 (CIDR)">
                <a-input v-decorator="['cidr', { rules: [{ required: true, message: '请输入 IP 段' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="VLAN">
                <a-input-number
                  v-decorator="['vlan_id', { rules: [{ required: true, message: '请输入 VLAN' }] }]"
                  :min="1"
                  :max="4094"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="VLANif">
                <a-input v-decorator="['vlanif_name']" placeholder="可选，例如：Vlanif10" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="VLANif 网关">
                <a-input v-decorator="['vlanif_gateway']" placeholder="可选，例如：10.0.0.1" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="启用">
                <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="备注">
            <a-textarea v-decorator="['description']" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { createIpRange, deleteIpRange, listIpRanges, updateIpRange, fetchFreeIp } from '@/api/ipRanges'

export default {
  name: 'IpRanges',
  data () {
    return {
      query: { q: '', is_active: '' },
      loading: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      tableHeight: 520,
      columns: [
        { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
        { title: 'IP 段', dataIndex: 'cidr', key: 'cidr', width: 160 },
        { title: 'VLAN', dataIndex: 'vlan_id', key: 'vlan_id', width: 90 },
        { title: 'VLANif', dataIndex: 'vlanif_name', key: 'vlanif_name', width: 120 },
        { title: '网关', dataIndex: 'vlanif_gateway', key: 'vlanif_gateway', width: 140 },
        { title: '启用', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '可用 IP 总数', dataIndex: 'total_count', key: 'total_count', width: 120 },
        { title: '已用', dataIndex: 'used_count', key: 'used_count', width: 100 },
        { title: '可用', dataIndex: 'free_count', key: 'free_count', width: 100 },
        { title: '使用率', dataIndex: 'usage_percent', key: 'usage_percent', width: 100, scopedSlots: { customRender: 'usage_percent' } },
        { title: '备注', dataIndex: 'description', key: 'description', width: 220 },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建 IP 段',
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
  mounted () {
    this.updateTableHeight()
    window.addEventListener('resize', this.updateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateTableHeight)
  },
  methods: {
    updateTableHeight () {
      const h = window.innerHeight || 800
      this.tableHeight = Math.max(h - 260, 220)
    },
    async fetch (page = 1) {
      this.loading = true
      try {
        const params = { page, q: this.query.q }
        if (this.query.is_active !== '') {
          params.is_active = this.query.is_active
        }
        const data = await listIpRanges(params)
        this.dataSource = data.results || []
        this.pagination.total = data.count || this.dataSource.length
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
    async handleFetchIp (record) {
      try {
        const res = await fetchFreeIp(record.id)
        const ip = (res && res.ip) || ''
        if (ip) {
          if (this.$info) {
            this.$info({
              title: '可用 IP',
              content: `网段：${record.cidr} 可用 IP：${ip}`
            })
          } else {
            this.$message.success(`网段：${record.cidr} 可用 IP：${ip}`)
          }
        } else {
          this.$message.warning('未找到可用 IP')
        }
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message || '未找到可用 IP'
        this.$notification.error({ message: '获取失败', description: detail })
      }
    },
    reset () {
      this.query.q = ''
      this.query.is_active = ''
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建 IP 段'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({ is_active: true })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑 IP 段'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.setFieldsValue({
          name: record.name,
          cidr: record.cidr,
          vlan_id: record.vlan_id,
          vlanif_name: record.vlanif_name,
          vlanif_gateway: record.vlanif_gateway,
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
          if (this.isEditing) {
            await updateIpRange(this.editing.id, values)
          } else {
            await createIpRange(values)
          }
          this.$notification.success({
            message: '成功',
            description: this.isEditing ? '已更新 IP 段' : '已创建 IP 段'
          })
          this.modalVisible = false
          this.fetch(this.pagination.current || 1)
        } catch (e) {
          this.$notification.error({
            message: '错误',
            description: (e.response && e.response.data && e.response.data.detail) || e.message || '提交失败'
          })
        } finally {
          this.modalLoading = false
        }
      })
    },
    async handleDelete (record) {
      this.loading = true
      try {
        await deleteIpRange(record.id)
        this.$notification.success({ message: '已删除', description: '删除成功' })
        const currentPage = this.pagination.current || 1
        const nextPage = this.dataSource.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
        this.fetch(nextPage)
      } catch (e) {
        this.$notification.error({
          message: '错误',
          description: (e.response && e.response.data && e.response.data.detail) || e.message || '删除失败'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
