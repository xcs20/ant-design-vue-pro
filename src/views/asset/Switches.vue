<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="10" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="编号/名称/主机名/IP/MAC" />
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
        <a-button v-if="$auth('switch.add')" type="primary" icon="plus" @click="openCreate">新建</a-button>
        <a-button style="margin-left: 8px" icon="download" @click="exportCsv">导出</a-button>
        <a-upload
          v-if="$auth('switch.add') || $auth('switch.update')"
          :showUploadList="false"
          :beforeUpload="() => false"
          @change="handleImport"
          style="margin-left: 8px"
        >
          <a-button icon="upload">批量导入</a-button>
        </a-upload>
        <a-tooltip title="CSV列：asset_tag,name,hostname,ip_address,vendor_id,category_id,location_id,snmp_profile_id,snmp_enabled,snmp_port,status,notes">
          <a-icon type="info-circle" style="margin-left: 8px; color: #888" />
        </a-tooltip>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1320, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="snmp_enabled" slot-scope="text, record">
          <a-tag v-if="record.snmp_enabled" color="green">启用</a-tag>
          <a-tag v-else>关闭</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('switch.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('switch.update')" type="vertical" />
          <a v-if="$auth('switch.update')" @click="handleSync(record)">同步</a>
          <a-divider v-if="$auth('switch.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('switch.delete')" title="确认删除该交换机？" @confirm="() => handleDelete(record)">
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
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="资产编号">
                <a-input
                  v-decorator="['asset_tag']"
                  placeholder="留空按规则自动生成"
                />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="名称">
                <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入名称' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="主机名">
                <a-input v-decorator="['hostname']" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="管理 IP">
                <a-input v-decorator="['ip_address', { rules: [{ required: true, message: '请输入管理 IP' }] }]" />
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
              <a-form-item label="状态">
                <a-select v-decorator="['status', { initialValue: 'in_stock' }]" style="width: 100%">
                  <a-select-option v-for="s in statuses" :key="s.value" :value="s.value">
                    {{ s.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="位置">
            <a-select v-decorator="['location']" allowClear placeholder="可选">
              <a-select-option v-for="l in locations" :key="l.id" :value="l.id">
                {{ l.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="厂商">
            <a-select v-decorator="['vendor']" allowClear placeholder="可选">
              <a-select-option v-for="v in vendors" :key="v.id" :value="v.id">
                {{ v.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-divider>SNMP</a-divider>
          <a-form-item label="启用 SNMP">
            <a-switch
              v-decorator="['snmp_enabled', { valuePropName: 'checked', initialValue: true }]"
              @change="onSnmpEnabledChange"
            />
          </a-form-item>

          <a-row v-if="snmpEnabled" :gutter="12">
            <a-col :md="16" :sm="24">
              <a-form-item label="SNMP 配置">
                <a-select v-decorator="['snmp_profile']" allowClear placeholder="请选择 SNMP 配置">
                  <a-select-option v-for="p in snmpProfiles" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="SNMP 端口">
                <a-input-number
                  v-decorator="['snmp_port', { initialValue: 161 }]"
                  :min="1"
                  :max="65535"
                  style="width: 100%"
                />
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
import {
  createSwitch,
  deleteSwitch,
  listLocations,
  listSnmpProfiles,
  listSwitches,
  updateSwitch,
  syncSwitchSnmp,
  listVendors,
  importSwitches
} from '@/api/cmdb'

export default {
  name: 'Switches',
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
        { title: '资产编号', dataIndex: 'asset_tag', key: 'asset_tag', width: 160 },
        { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '主机名', dataIndex: 'hostname', key: 'hostname', width: 180 },
        { title: '管理IP', dataIndex: 'ip_address', key: 'ip_address', width: 140 },
        { title: '厂商', dataIndex: 'vendor_name', key: 'vendor_name', width: 140 },
        { title: '版本', dataIndex: 'version_info', key: 'version_info', width: 200 },
        { title: '状态', dataIndex: 'status_label', key: 'status_label', width: 90 },
        { title: 'SNMP', dataIndex: 'snmp_enabled', key: 'snmp_enabled', width: 90, scopedSlots: { customRender: 'snmp_enabled' } },
        { title: 'SNMP配置', dataIndex: 'snmp_profile_name', key: 'snmp_profile_name', width: 180 },
        { title: '位置', dataIndex: 'location_name', key: 'location_name', width: 140 },
        { title: '操作', key: 'actions', width: 160, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      statuses: [
        { value: 'in_stock', label: '库存' },
        { value: 'in_use', label: '在用' },
        { value: 'maintenance', label: '维护' },
        { value: 'retired', label: '报废' },
        { value: 'lost', label: '丢失' }
      ],
      locations: [],
      vendors: [],
      snmpProfiles: [],
      modalVisible: false,
      modalLoading: false,
      modalTitle: '新建交换机',
      editing: null,
      form: this.$form.createForm(this),
      snmpEnabled: true,
      syncLoadingId: null
    }
  },
  created () {
    this.bootstrap()
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
    async bootstrap () {
      await Promise.all([this.fetch(1), this.fetchLookups()])
    },
    async handleImport ({ file }) {
      if (!file) return
      this.loading = true
      try {
        const res = await importSwitches(file)
        const { created = 0, updated = 0, errors = [] } = res
        let msg = `导入完成，新增 ${created} 条，更新 ${updated} 条`
        if (errors && errors.length) {
          msg += `，有 ${errors.length} 条失败`
          this.$notification.error({
            message: '部分失败',
            description: errors.slice(0, 5).join('；') + (errors.length > 5 ? '…' : '')
          })
        } else {
          this.$message.success(msg)
        }
        this.fetch(this.pagination.current || 1)
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '导入失败', description: detail })
      } finally {
        this.loading = false
      }
    },
    async fetchLookups () {
      try {
        const [locationsData, profilesData, vendorsData] = await Promise.all([
          listLocations({ page: 1 }),
          listSnmpProfiles({ page: 1, is_active: 1 }),
          listVendors({ page: 1, page_size: 500 })
        ])
        this.locations = locationsData.results || []
        this.snmpProfiles = profilesData.results || []
        this.vendors = vendorsData.results || []
      } catch (e) {
        // ignore
      }
    },
    async fetch (page) {
      this.loading = true
      try {
        const data = await listSwitches({ page, q: this.query.q })
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
    exportCsv () {
      if (!this.dataSource.length) {
        this.$message.info('没有数据可导出')
        return
      }
      const headers = ['资产编号', '名称', '主机名', '管理IP', '厂商', '版本', '状态', 'SNMP', 'SNMP配置', '位置']
      const rows = this.dataSource.map(r => [
        r.asset_tag,
        r.name,
        r.hostname,
        r.ip_address,
        r.vendor_name,
        r.version_info,
        r.status_label,
        r.snmp_enabled ? '启用' : '关闭',
        r.snmp_profile_name,
        r.location_name
      ])
      const csv = [headers, ...rows].map(r => r.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'switches.csv'
      link.click()
      URL.revokeObjectURL(url)
    },
    async handleSync (record) {
      this.syncLoadingId = record.id
      try {
        const res = await syncSwitchSnmp(record.id)
        if (res && res.status === 'queued') {
          const description = `任务已提交，接口任务ID ${res.interfaces_task_id}`
          this.$notification.success({ message: '已提交接口同步任务', description })
        } else {
          const ifs = res.interfaces || {}
          const description = `接口 ${ifs.interfaces || 0} 条，地址 ${ifs.addresses || 0} 条`
          this.$notification.success({ message: '接口同步完成', description })
          this.fetch(this.pagination.current || 1)
        }
      } catch (e) {
        this.$notification.error({
          message: '同步失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      } finally {
        this.syncLoadingId = null
      }
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建交换机'
      this.modalVisible = true
      this.snmpEnabled = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          status: 'in_stock',
          snmp_enabled: true,
          snmp_port: 161
        })
      })
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = '编辑交换机'
      this.modalVisible = true
      this.snmpEnabled = !!record.snmp_enabled
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({
          asset_tag: record.asset_tag,
          name: record.name,
          hostname: record.hostname,
          ip_address: record.ip_address,
          mac_address: record.mac_address,
          status: record.status,
          location: record.location,
          snmp_enabled: record.snmp_enabled,
          snmp_profile: record.snmp_profile,
          snmp_port: record.snmp_port,
          notes: record.notes
        })
      })
    },
    handleCancel () {
      this.modalVisible = false
    },
    handleSubmit () {
      const snmpEnabled = this.form.getFieldValue('snmp_enabled')
      this.snmpEnabled = !!snmpEnabled

      this.form.validateFields(async (err, values) => {
        if (err) return
        if (values.snmp_enabled && !values.snmp_profile) {
          this.$message.error('启用 SNMP 时必须选择 SNMP 配置')
          return
        }

        this.modalLoading = true
        try {
          const payload = { ...values }
          if (!payload.snmp_enabled) {
            payload.snmp_profile = null
          }
          if (this.editing) {
            await updateSwitch(this.editing.id, payload)
            this.$message.success('已保存')
          } else {
            await createSwitch(payload)
            this.$message.success('已创建')
          }
          this.modalVisible = false
          this.fetch(this.pagination.current)
          this.fetchLookups()
        } catch (e) {
          const data = (e.response && e.response.data) || {}
          const detail = data.detail || data.message || JSON.stringify(data)
          this.$notification.error({ message: '保存失败', description: detail })
        } finally {
          this.modalLoading = false
        }
      })
    },
    onSnmpEnabledChange (checked) {
      this.snmpEnabled = !!checked
    },
    async handleDelete (record) {
      try {
        await deleteSwitch(record.id)
        this.$message.success('已删除')
        this.fetch(this.pagination.current)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    }
  },
  watch: {
    modalVisible (val) {
      if (!val) return
      this.$nextTick(() => {
        const snmpEnabled = this.form.getFieldValue('snmp_enabled')
        this.snmpEnabled = !!snmpEnabled
      })
    }
  }
}
</script>

<style lang="less" scoped>
.table-operator {
  margin-bottom: 12px;
}
</style>
