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
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSwitchInterfaces, syncSwitchInterfaces, listSwitches } from '@/api/cmdb'

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
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: '交换机', dataIndex: 'switch', key: 'switch', width: 160, customRender: (_, record) => (record.switch_name || record.switch) },
        { title: '接口', dataIndex: 'name', key: 'name', width: 160 },
        { title: '状态', dataIndex: 'oper_status', key: 'oper_status', width: 100, scopedSlots: { customRender: 'status' } },
        { title: 'MAC', dataIndex: 'mac_address', key: 'mac_address', width: 180 },
        { title: '速率(bps)', dataIndex: 'speed_bps', key: 'speed_bps', width: 140 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 220 },
        { title: '地址', dataIndex: 'addresses', key: 'addresses', width: 260, scopedSlots: { customRender: 'ips' } }
      ],
      switchOptions: [],
      switchSearchTimer: null
    }
  },
  created () {
    this.fetch(1)
    this.onSwitchSearch('')
    this.sync()
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
        const data = await listSwitchInterfaces(params)
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
      this.query.switch = undefined
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    async sync () {
      this.syncing = true
      try {
        const res = await syncSwitchInterfaces(this.query.switch || null)
        const detail = res
          ? `接口 ${res.interfaces || 0} 条，地址 ${res.addresses || 0} 条，跳过 ${res.skipped || 0}`
          : 'SNMP 同步接口成功'
        this.$notification.success({ message: '已触发同步', description: detail })
        this.fetch(1)
      } catch (e) {
        this.$notification.error({
          message: '同步失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
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
      }, 200)
    }
  }
}
</script>
