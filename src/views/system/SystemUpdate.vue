<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-operator">
        <a-upload
          :showUploadList="false"
          :beforeUpload="() => false"
          @change="handleUpload"
        >
          <a-button type="primary" icon="upload" :loading="uploading">上传更新包</a-button>
        </a-upload>
        <span class="hint">支持 zip 格式，包含 frontend/ 或 backend/ 目录</span>
      </div>

      <a-table
        :columns="columns"
        :dataSource="dataSource"
        :loading="loading"
        :pagination="pagination"
        rowKey="id"
        :scroll="{ x: 1100, y: tableHeight }"
        @change="handleTableChange"
      >
        <template slot="status" slot-scope="text">
          <a-tag v-if="text === 'applied'" color="green">已应用</a-tag>
          <a-tag v-else-if="text === 'failed'" color="red">失败</a-tag>
          <a-tag v-else>已上传</a-tag>
        </template>
        <template slot="actions" slot-scope="text, record">
          <a-popconfirm title="确认应用该更新包？" @confirm="() => handleApply(record)">
            <a>应用</a>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { listSystemUpdates, uploadSystemUpdate, applySystemUpdate } from '@/api/system'

export default {
  name: 'SystemUpdate',
  data () {
    return {
      loading: false,
      uploading: false,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: total => `共 ${total} 条`
      },
      tableHeight: 520,
      columns: [
        { title: '文件名', dataIndex: 'filename', key: 'filename', width: 220 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 120 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 120, scopedSlots: { customRender: 'status' } },
        { title: '上传人', dataIndex: 'uploaded_by_name', key: 'uploaded_by_name', width: 120 },
        { title: '上传时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
        { title: '应用时间', dataIndex: 'applied_at', key: 'applied_at', width: 180 },
        { title: '备注', dataIndex: 'message', key: 'message', width: 260 },
        { title: '操作', key: 'actions', width: 120, scopedSlots: { customRender: 'actions' } }
      ]
    }
  },
  created () {
    this.fetch(1)
    this.updateTableHeight()
    window.addEventListener('resize', this.updateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateTableHeight)
  },
  methods: {
    async fetch (page) {
      this.loading = true
      try {
        const res = await listSystemUpdates({ page: page || 1 })
        this.dataSource = res.results || []
        this.pagination.total = res.count || 0
        this.pagination.current = page || 1
      } catch (e) {
        this.$notification.error({
          message: '获取失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      } finally {
        this.loading = false
      }
    },
    async handleUpload ({ file }) {
      if (!file) return
      this.uploading = true
      try {
        await uploadSystemUpdate(file)
        this.$notification.success({ message: '上传成功' })
        this.fetch(1)
      } catch (e) {
        this.$notification.error({
          message: '上传失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      } finally {
        this.uploading = false
      }
    },
    async handleApply (record) {
      if (!record) return
      try {
        const res = await applySystemUpdate(record.id)
        const detail = res.message || '已应用更新包，请重启服务以生效后端更新'
        this.$notification.success({ message: '应用完成', description: detail })
        this.fetch(this.pagination.current)
      } catch (e) {
        this.$notification.error({
          message: '应用失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message
        })
      }
    },
    handleTableChange (pagination) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.fetch(pagination.current)
    },
    updateTableHeight () {
      const height = window.innerHeight || 800
      this.tableHeight = Math.max(240, height - 360)
    }
  }
}
</script>

<style scoped>
.table-operator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.hint {
  color: #888;
  font-size: 12px;
}
</style>
