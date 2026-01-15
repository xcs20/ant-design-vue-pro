<template>
  <page-header-wrapper :title="null">
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="16">
            <a-col :md="8" :sm="24">
              <a-form-item label="来源主机">
                <a-input v-model="query.host" placeholder="主机名/IP" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="严重级别">
                <a-select v-model="query.severity" allowClear placeholder="全部" style="width: 160px">
                  <a-select-option v-for="s in severities" :key="s" :value="s">{{ s }}</a-select-option>
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

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400, y: tableHeight }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="severity" slot-scope="text">
          <a-tag :color="severityColor(text)">{{ text || '-' }}</a-tag>
        </template>
        <template slot="timestamp" slot-scope="text">
          <span>{{ formatTime(text) }}</span>
        </template>
      </a-table>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSyslogEntries } from '@/api/audit'

export default {
  name: 'SyslogEntries',
  data () {
    return {
      query: { host: '', severity: '' },
      loading: false,
      dataSource: [],
      tableHeight: 520,
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      severities: ['emerg', 'alert', 'crit', 'err', 'warn', 'notice', 'info', 'debug'],
      columns: [
        { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180, scopedSlots: { customRender: 'timestamp' } },
        { title: '主机', dataIndex: 'host', key: 'host', width: 180 },
        { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 120, scopedSlots: { customRender: 'severity' } },
        { title: 'Tag', dataIndex: 'tag', key: 'tag', width: 160 },
        { title: '消息', dataIndex: 'message', key: 'message', width: 400, ellipsis: true },
        { title: '原文', dataIndex: 'raw', key: 'raw', width: 400, ellipsis: true }
      ]
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
    formatTime (ts) {
      if (!ts) return '-'
      return new Date(ts).toLocaleString()
    },
    severityColor (sev) {
      const s = (sev || '').toLowerCase()
      if (['emerg', 'alert', 'crit', 'err'].includes(s)) return 'red'
      if (['warn', 'warning'].includes(s)) return 'orange'
      if (s === 'notice') return 'blue'
      return 'green'
    },
    reset () {
      this.query = { host: '', severity: '' }
      this.fetch(1)
    },
    async fetch (page = 1) {
      this.loading = true
      try {
        const params = { page }
        if (this.query.host) params.host = this.query.host
        if (this.query.severity) params.severity = this.query.severity
        const data = await listSyslogEntries(params)
        this.dataSource = data.results || []
        this.pagination.total = data.count || this.dataSource.length
        this.pagination.current = page
      } catch (e) {
        const detail = (e.response && e.response.data && e.response.data.detail) || e.message
        this.$notification.error({ message: '加载失败', description: detail })
      } finally {
        this.loading = false
      }
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    }
  }
}
</script>
