<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="10" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="IP/MAC/端口/网络设备" />
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
        <a-button v-if="$auth('asset.add')" type="primary" icon="plus" @click="openCreate">新建</a-button>
        <a-button
          v-if="$auth('asset.update')"
          style="margin-left: 8px"
          icon="sync"
          :loading="syncing"
          @click="syncFromNetdisco"
        >
          同步 IP 资产
        </a-button>
        <a-button style="margin-left: 8px" icon="download" @click="exportCsv">导出</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="is_active" slot-scope="text, record">
          <a-tag v-if="record.is_active" color="green">启用</a-tag>
          <a-tag v-else>停用</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('asset.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('asset.update') && $auth('asset.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('asset.delete')" title="确认删除该资产？" @confirm="() => handleDelete(record)">
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
        width="860px"
      >
        <a-form :form="form" layout="vertical">
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="网络设备">
                <a-select
                  v-decorator="['switch', { rules: [{ required: true, message: '请选择交换机' }] }]"
                  showSearch
                  allowClear
                  placeholder="输入关键字搜索网络设备"
                  :filterOption="false"
                  @search="onSwitchSearch"
                >
                  <a-select-option v-for="s in switchOptions" :key="s.id" :value="s.id">
                    {{ s.asset_tag }} {{ s.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="端口">
                <a-input v-decorator="['port', { rules: [{ required: true, message: '请输入端口' }] }]" placeholder="Gi1/0/1" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="IP 地址">
                <a-input v-decorator="['ip_address', { rules: [{ required: true, message: '请输入 IP 地址' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="MAC 地址">
                <a-input v-decorator="['mac_address', { rules: [{ required: true, message: '请输入 MAC 地址' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="VLAN">
                <a-input-number v-decorator="['vlan']" :min="1" :max="4094" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="启用">
                <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
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
import { createPortAsset, deletePortAsset, listPortAssets, updatePortAsset, syncPortAssetsSnmp } from '@/api/portAssets'
import { listSwitches } from '@/api/cmdb'

export default {
  name: 'PortAssets',
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
      tableHeight: 520,
      columns: [
        { title: '网络设备', dataIndex: 'switch_asset_tag', key: 'switch_asset_tag', width: 160 },
        { title: '接口', dataIndex: 'physical_port', key: 'physical_port', width: 120 },
        { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', width: 140 },
        { title: 'MAC', dataIndex: 'mac_address', key: 'mac_address', width: 180 },
        { title: 'VLAN', dataIndex: 'vlan', key: 'vlan', width: 90 },
        { title: 'Vlanif', dataIndex: 'vlanif_name', key: 'vlanif_name', width: 120 },
        { title: 'Vlanif网关', dataIndex: 'vlan_gateway', key: 'vlan_gateway', width: 160 },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90, scopedSlots: { customRender: 'is_active' } },
        { title: '备注', dataIndex: 'notes', key: 'notes', width: 260 },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建端口资产',
      editing: null,
      form: this.$form.createForm(this),
      switchOptions: [],
      switchSearchTimer: null,
      syncing: false
    }
  },
  computed: {
    isEditing () {
      return !!this.editing
    }
  },
  created () {
    this.fetch(1)
    this.onSwitchSearch('')
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
    async fetch (page) {
      this.loading = true
      try {
        const data = await listPortAssets({ page, q: this.query.q })
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
      this.modalTitle = '新建端口资产'
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          is_active: true
        })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑端口资产'
      this.modalVisible = true
      if (record.switch && !this.switchOptions.find(s => s.id === record.switch)) {
        this.switchOptions = [
          { id: record.switch, asset_tag: record.switch_asset_tag, name: record.switch_name },
          ...this.switchOptions
        ]
      }
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          switch: record.switch,
          port: record.port,
          ip_address: record.ip_address,
          mac_address: record.mac_address,
          vlan: record.vlan,
          is_active: record.is_active,
          notes: record.notes
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
          if (this.isEditing) {
            await updatePortAsset(this.editing.id, payload)
            this.$message.success('已保存')
          } else {
            await createPortAsset(payload)
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
        await deletePortAsset(record.id)
        this.$message.success('已删除')
        this.fetch(this.pagination.current || 1)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    },
    async syncFromNetdisco () {
      this.syncing = true
      try {
        const res = await syncPortAssetsSnmp()
        if (res && res.status === 'queued') {
          this.$notification.success({
            message: '已提交同步任务',
            description: `任务ID ${res.task_id}`
          })
        } else {
          const detail = res
            ? `新增 ${res.created || 0}，更新 ${res.updated || 0}，跳过 ${res.skipped || 0}，错误 ${res.errors || 0}`
            : '已触发 SNMP 同步端口资产'
          this.$notification.success({
            message: '同步完成',
            description: detail
          })
          this.fetch(1)
        }
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '同步失败', description: detail || '暂未实现或接口异常' })
      } finally {
        this.syncing = false
      }
    },
    onSwitchSearch (value) {
      if (this.switchSearchTimer) {
        clearTimeout(this.switchSearchTimer)
      }
      this.switchSearchTimer = setTimeout(async () => {
        try {
          const data = await listSwitches({ page: 1, q: value || '' })
          this.switchOptions = (data.results || []).map((s) => ({ id: s.id, asset_tag: s.asset_tag, name: s.name }))
        } catch (e) {
          // ignore
        }
      }, 250)
    },
    exportCsv () {
      if (!this.dataSource.length) {
        this.$message.info('没有数据可导出')
        return
      }
      const headers = ['交换机', '接口', 'IP', 'MAC', 'VLAN', 'Vlanif', 'Vlanif网关', '状态', '备注']
      const rows = this.dataSource.map(r => [
        r.switch_asset_tag,
        r.physical_port,
        r.ip_address,
        r.mac_address,
        r.vlan,
        r.vlanif_name,
        r.vlan_gateway,
        r.is_active ? '启用' : '停用',
        r.notes
      ])
      const csv = [headers, ...rows].map(r => r.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'port-assets.csv'
      link.click()
      URL.revokeObjectURL(url)
    }
  }
}
</script>
