<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="用户名/路径/视图" />
              </a-form-item>
            </a-col>
            <a-col :md="5" :sm="24">
              <a-form-item label="方法">
                <a-select v-model="query.method" allowClear placeholder="全部" style="width: 100%">
                  <a-select-option value="POST">POST</a-select-option>
                  <a-select-option value="PUT">PUT</a-select-option>
                  <a-select-option value="PATCH">PATCH</a-select-option>
                  <a-select-option value="DELETE">DELETE</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="4" :sm="24">
              <a-form-item label="状态码">
                <a-input v-model="query.status_code" placeholder="例如 200" />
              </a-form-item>
            </a-col>
            <a-col :md="7" :sm="24">
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
        :scroll="{ x: 1080 }"
        rowKey="id"
        @change="handleTableChange"
      >
        <template slot="created_at" slot-scope="text, record">
          <span v-if="record.created_at">{{ record.created_at | moment }}</span>
          <span v-else>-</span>
        </template>
        <template slot="user" slot-scope="text, record">
          <span>{{ record.user_username || record.username || '-' }}</span>
        </template>
        <template slot="status_code" slot-scope="text, record">
          <a-tag v-if="record.status_code >= 400" color="red">{{ record.status_code }}</a-tag>
          <a-tag v-else color="green">{{ record.status_code }}</a-tag>
        </template>
        <template slot="method" slot-scope="text, record">
          <a-tag color="blue">{{ record.method }}</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a @click="openDetail(record)">查看</a>
        </template>
      </a-table>

      <a-modal title="操作详情" :visible="detailVisible" @cancel="detailVisible = false" :footer="null" width="860px">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="时间" :span="2">
            <span v-if="detailRecord && detailRecord.created_at">{{ detailRecord.created_at | moment }}</span>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="用户">{{ (detailRecord && (detailRecord.user_username || detailRecord.username)) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="状态码">{{ (detailRecord && detailRecord.status_code) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="方法">{{ (detailRecord && detailRecord.method) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="IP">{{ (detailRecord && detailRecord.ip_address) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="耗时(ms)">{{ (detailRecord && detailRecord.duration_ms) || 0 }}</a-descriptions-item>
          <a-descriptions-item label="路径" :span="2">{{ (detailRecord && detailRecord.path) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="视图" :span="2">{{ (detailRecord && detailRecord.view_name) || '-' }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>请求数据</a-divider>
        <pre style="max-height: 360px; overflow: auto; background: #0b1021; color: #e6edf3; padding: 12px; border-radius: 6px">{{ pretty(detailRecord && detailRecord.request_data) }}</pre>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listOperationLogs } from '@/api/system'

export default {
  name: 'OperationLogs',
  data () {
    return {
      query: { q: '', method: undefined, status_code: '' },
      loading: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: (total) => `共 ${total} 条`
      },
      columns: [
        { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 220, scopedSlots: { customRender: 'created_at' } },
        { title: '用户', key: 'user', width: 140, scopedSlots: { customRender: 'user' } },
        { title: '方法', dataIndex: 'method', key: 'method', width: 100, scopedSlots: { customRender: 'method' } },
        { title: '状态码', dataIndex: 'status_code', key: 'status_code', width: 100, scopedSlots: { customRender: 'status_code' } },
        { title: '路径', dataIndex: 'path', key: 'path', width: 420 },
        { title: '操作', key: 'actions', width: 100, fixed: 'right', scopedSlots: { customRender: 'actions' } }
      ],
      detailVisible: false,
      detailRecord: null
    }
  },
  created () {
    this.fetch(1)
  },
  methods: {
    async fetch (page) {
      this.loading = true
      try {
        const params = { page, q: this.query.q }
        if (this.query.method) params.method = this.query.method
        if ((this.query.status_code || '').trim()) params.status_code = (this.query.status_code || '').trim()
        const data = await listOperationLogs(params)
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
      this.query = { q: '', method: undefined, status_code: '' }
      this.fetch(1)
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    openDetail (record) {
      this.detailRecord = record
      this.detailVisible = true
    },
    pretty (data) {
      try {
        if (!data) return '{}'
        return JSON.stringify(data, null, 2)
      } catch (e) {
        return String(data || '')
      }
    }
  }
}
</script>
