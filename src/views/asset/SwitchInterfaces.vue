<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="交换机">
                <a-select
                  v-model="query.switch"
                  showSearch
                  allowClear
                  placeholder="选择交换机"
                  :filterOption="false"
                  @search="onSwitchSearch"
                >
                  <a-select-option v-for="s in switchOptions" :key="s.id" :value="s.id">
                    {{ s.asset_tag }} {{ s.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="接口/IP" />
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
        <a-button
          v-if="$auth('switch.update')"
          type="primary"
          icon="sync"
          :loading="syncing"
          @click="sync"
        >
          同步接口
        </a-button>
        <a-button style="margin-left: 8px" icon="download" @click="exportCsv">导出</a-button>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('switch.update')" @click="openEdit(record)">编辑</a>
        </template>
        <template slot="ips" slot-scope="text, record">
          <div v-if="record.addresses && record.addresses.length">
            <div v-for="addr in record.addresses" :key="addr.id">
              <a-tag color="blue" v-if="addr.is_primary">主</a-tag>
              {{ addr.ip_address }}/{{ addr.prefixlen }}
            </div>
          </div>
          <span v-else>-</span>
        </template>
        <template slot="status" slot-scope="text, record">
          <a-tag :color="record.oper_status === '1' ? 'green' : 'red'">
            {{ statusLabel(record) }}
          </a-tag>
        </template>
      </a-table>

      <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleSubmit"
        @cancel="handleCancel"
        width="640px"
      >
        <a-form :form="form" layout="vertical">
          <a-form-item label="接口名称">
            <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入接口名称' }] }]" />
          </a-form-item>
          <a-form-item label="描述">
            <a-input v-decorator="['description']" />
          </a-form-item>
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="接口类型">
                <a-select v-decorator="['interface_type', { initialValue: 'other' }]">
                  <a-select-option value="copper">电口</a-select-option>
                  <a-select-option value="fiber">光口</a-select-option>
                  <a-select-option value="management">管理口</a-select-option>
                  <a-select-option value="other">其他</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="管理状态(adminStatus)">
                <a-select v-decorator="['admin_status']" allowClear>
                  <a-select-option value="1">UP</a-select-option>
                  <a-select-option value="2">DOWN</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="链路状态(operStatus)">
                <a-select v-decorator="['oper_status']" allowClear>
                  <a-select-option value="1">UP</a-select-option>
                  <a-select-option value="2">DOWN</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="MAC">
                <a-input v-decorator="['mac_address']" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="速率(bps)">
                <a-input-number v-decorator="['speed_bps']" :min="0" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="VLAN ID">
                <a-input-number v-decorator="['vlan_id']" :min="1" :max="4094" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="VLAN 模式">
                <a-select v-decorator="['vlan_mode', { initialValue: 'unknown' }]">
                  <a-select-option value="access">Access</a-select-option>
                  <a-select-option value="trunk">Trunk</a-select-option>
                  <a-select-option value="hybrid">Hybrid</a-select-option>
                  <a-select-option value="unknown">未知</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSwitchInterfaces, syncSwitchInterfaces, listSwitches, updateSwitchInterface } from '@/api/cmdb'

export default {
  name: 'SwitchInterfaces',
  data () {
    return {
      query: { switch: this.$route.query.switch || undefined, q: '' },
      loading: false,
      syncing: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '30', '50', '100'],
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: '交换机', dataIndex: 'switch', key: 'switch', width: 160, customRender: (_, record) => (record.switch_name || record.switch) },
        { title: '接口', dataIndex: 'name', key: 'name', width: 140 },
        { title: '类型', dataIndex: 'interface_type_label', key: 'interface_type_label', width: 110 },
        { title: '状态', dataIndex: 'oper_status', key: 'oper_status', width: 100, scopedSlots: { customRender: 'status' } },
        { title: 'MAC', dataIndex: 'mac_address', key: 'mac_address', width: 180 },
        { title: '速率(bps)', dataIndex: 'speed_bps', key: 'speed_bps', width: 120 },
        { title: 'VLAN', dataIndex: 'vlan_id', key: 'vlan_id', width: 90 },
        { title: '模式', dataIndex: 'vlan_mode_label', key: 'vlan_mode_label', width: 100 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true },
        { title: '地址', dataIndex: 'addresses', key: 'addresses', width: 240, scopedSlots: { customRender: 'ips' } },
        { title: '操作', key: 'actions', width: 120, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      switchOptions: [],
      switchSearchTimer: null,
      modalVisible: false,
      modalLoading: false,
      modalTitle: '',
      editing: null,
      form: this.$form.createForm(this)
    }
  },
  created () {
    this.fetch(1)
    this.onSwitchSearch('')
  },
  methods: {
    statusLabel (record) {
      if (record.oper_status === 1 || record.oper_status === '1') return 'UP'
      if (record.oper_status === 2 || record.oper_status === '2') return 'DOWN'
      return record.oper_status || '-'
    },
    async fetch (page) {
      this.loading = true
      try {
        const params = { page, q: this.query.q }
        if (this.query.switch) params.switch = this.query.switch
        params.page_size = this.pagination.pageSize
        const data = await listSwitchInterfaces(params)
        this.dataSource = data.results || []
        const total = data.count || 0
        const pageSize = this.pagination.pageSize || 20
        const current = page
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        // 如果请求页大于总页数且无数据，回到第 1 页
        if (!this.dataSource.length && current > 1 && current > totalPages) {
          this.updatePagination({ current: 1, total, pageSize })
          this.fetch(1)
          return
        }
        this.updatePagination({ current, total, pageSize })
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
      this.query.switch = undefined
      this.fetch(1)
    },
    handleTableChange (pagination) {
      const newPageSize = pagination && pagination.pageSize ? pagination.pageSize : this.pagination.pageSize
      const newPage = pagination && pagination.current ? pagination.current : 1
      const changedSize = newPageSize !== this.pagination.pageSize
      this.updatePagination({ pageSize: newPageSize, current: changedSize ? 1 : newPage })
      this.fetch(changedSize ? 1 : newPage)
    },
    updatePagination ({ current, total, pageSize }) {
      this.pagination = {
        ...this.pagination,
        current: current != null ? current : this.pagination.current,
        total: total != null ? total : this.pagination.total,
        pageSize: pageSize != null ? pageSize : this.pagination.pageSize
      }
    },
    async sync () {
      this.syncing = true
      try {
        const res = await syncSwitchInterfaces(this.query.switch || null)
        const detail = res
          ? `接口 ${res.interfaces || 0} 条，地址 ${res.addresses || 0} 条，跳过 ${res.skipped || 0}`
          : 'SNMP 同步接口成功'
        this.$notification.success({ message: '同步完成', description: detail })
        console.log('[SyncInterfaces] result', res)
        this.fetch(1)
      } catch (e) {
        this.$notification.error({
          message: '同步失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
        console.error('[SyncInterfaces] error', e)
      } finally {
        this.syncing = false
      }
    },
    exportCsv () {
      if (!this.dataSource.length) {
        this.$message.info('没有数据可导出')
        return
      }
      const headers = ['交换机', '接口', '类型', '状态', 'MAC', '速率', 'VLAN', '模式', '描述', '地址']
      const rows = this.dataSource.map(r => {
        const ips = (r.addresses || []).map(a => `${a.ip_address}/${a.prefixlen}`).join('; ')
        const status = (r.oper_status === 1 || r.oper_status === '1') ? 'UP' : (r.oper_status || '')
        return [
          r.switch_name || r.switch,
          r.name,
          r.interface_type_label,
          status,
          r.mac_address,
          r.speed_bps,
          r.vlan_id,
          r.vlan_mode_label,
          r.description,
          ips
        ]
      })
      const csv = [headers, ...rows].map(r => r.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'switch-interfaces.csv'
      link.click()
      URL.revokeObjectURL(url)
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
      }, 200)
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = `编辑接口 - ${record.name}`
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          name: record.name,
          description: record.description,
          interface_type: record.interface_type,
          admin_status: record.admin_status != null ? String(record.admin_status) : undefined,
          oper_status: record.oper_status != null ? String(record.oper_status) : undefined,
          mac_address: record.mac_address,
          speed_bps: record.speed_bps,
          vlan_id: record.vlan_id,
          vlan_mode: record.vlan_mode || 'unknown'
        })
      })
    },
    handleCancel () {
      this.modalVisible = false
      this.editing = null
    },
    handleSubmit () {
      if (!this.editing) return
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.modalLoading = true
        try {
          await updateSwitchInterface(this.editing.id, values)
          this.$message.success('已保存')
          this.modalVisible = false
          this.fetch(this.pagination.current || 1)
        } catch (e) {
          const detail = (e.response && e.response.data && e.response.data.detail) || e.message
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.modalLoading = false
        }
      })
    }
  }
}
</script>
