<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="24">
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字">
                <a-input v-model="query.q" placeholder="名称/版本匹配/描述" />
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
        <a-button v-if="$auth('system.add')" type="primary" icon="plus" @click="openCreate">新建</a-button>
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
        <template slot="actions" slot-scope="text, record">
          <a v-if="$auth('system.update')" @click="openEdit(record)">编辑</a>
          <a-divider v-if="$auth('system.update') && $auth('system.delete')" type="vertical" />
          <a-popconfirm v-if="$auth('system.delete')" title="确认删除该配置？" @confirm="() => handleDelete(record)">
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
        width="840px"
      >
        <a-form :form="form" layout="vertical">
          <a-form-item label="名称">
            <a-input v-decorator="['name', { rules: [{ required: true, message: '请输入名称' }] }]" />
          </a-form-item>
          <a-form-item label="版本匹配(正则)">
            <a-input
              v-decorator="['version_pattern']"
              placeholder="可选，用于匹配 switch.version_info"
            />
            <small>留空表示默认规则；第一个匹配的配置将被使用</small>
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-decorator="['description']" :rows="2" />
          </a-form-item>

          <a-divider>OID 配置</a-divider>
          <a-row :gutter="12">
            <a-col :md="12" :sm="24">
              <a-form-item label="ifName OID">
                <a-input v-decorator="['if_name_oid', { rules: [{ required: true, message: '请输入 ifName OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="ifDescr OID">
                <a-input v-decorator="['if_descr_oid', { rules: [{ required: true, message: '请输入 ifDescr OID' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="ifType OID">
                <a-input v-decorator="['if_type_oid', { rules: [{ required: true, message: '请输入 ifType OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="ifAdminStatus OID">
                <a-input v-decorator="['admin_status_oid', { rules: [{ required: true, message: '请输入 ifAdminStatus OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="ifOperStatus OID">
                <a-input v-decorator="['oper_status_oid', { rules: [{ required: true, message: '请输入 ifOperStatus OID' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="ifPhysAddress OID">
                <a-input v-decorator="['mac_oid', { rules: [{ required: true, message: '请输入 ifPhysAddress OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="ifSpeed OID">
                <a-input v-decorator="['speed_oid', { rules: [{ required: true, message: '请输入 ifSpeed OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="IP IfIndex OID">
                <a-input v-decorator="['ip_ifindex_oid', { rules: [{ required: true, message: '请输入 IP IfIndex OID' }] }]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :md="8" :sm="24">
              <a-form-item label="IP Netmask OID">
                <a-input v-decorator="['ip_netmask_oid', { rules: [{ required: true, message: '请输入 IP Netmask OID' }] }]" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="是否启用">
                <a-switch v-decorator="['is_active', { valuePropName: 'checked', initialValue: true }]" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import {
  createSnmpOidProfile,
  deleteSnmpOidProfile,
  listSnmpOidProfiles,
  updateSnmpOidProfile
} from '@/api/cmdb'

export default {
  name: 'SnmpOidProfiles',
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
        { title: '名称', dataIndex: 'name', key: 'name' },
        { title: '版本匹配(正则)', dataIndex: 'version_pattern', key: 'version_pattern' },
        { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '启用', dataIndex: 'is_active', key: 'is_active', scopedSlots: { customRender: 'is_active' }, width: 120 },
        { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 200 },
        { title: '操作', key: 'actions', scopedSlots: { customRender: 'actions' }, width: 160 }
      ],
      form: this.$form.createForm(this),
      modalVisible: false,
      modalLoading: false,
      modalTitle: '',
      editing: null
    }
  },
  created () {
    this.fetch(1)
  },
  methods: {
    async fetch (page = 1) {
      this.loading = true
      try {
        const data = await listSnmpOidProfiles({ page, ...this.query })
        this.dataSource = data.results || []
        this.pagination = {
          ...this.pagination,
          current: page,
          total: data.count || 0
        }
      } catch (e) {
        this.$notification.error({
          message: '加载失败',
          description: (e.response && e.response.data && e.response.data.detail) || e.message || '加载 SNMP OID 配置失败'
        })
      } finally {
        this.loading = false
      }
    },
    handleTableChange (pagination) {
      this.fetch(pagination.current || 1)
    },
    reset () {
      this.query = { q: '' }
      this.fetch(1)
    },
    openCreate () {
      this.editing = null
      this.modalTitle = '新建 OID 配置'
      this.modalVisible = true
      this.$nextTick(() => this.form.resetFields())
    },
    openEdit (record) {
      this.editing = record
      this.modalTitle = `编辑 - ${record.name}`
      this.modalVisible = true
      this.$nextTick(() => {
        this.form.resetFields()
        this.form.setFieldsValue({ ...record })
      })
    },
    handleCancel () {
      this.modalVisible = false
      this.editing = null
    },
    handleSubmit () {
      this.form.validateFields(async (err, values) => {
        if (err) return
        this.modalLoading = true
        try {
          if (this.editing) {
            await updateSnmpOidProfile(this.editing.id, values)
            this.$message.success('已更新')
          } else {
            await createSnmpOidProfile(values)
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
        await deleteSnmpOidProfile(record.id)
        this.$message.success('已删除')
        this.fetch(this.pagination.current)
      } catch (e) {
        const data = (e.response && e.response.data) || {}
        const detail = data.detail || data.message || JSON.stringify(data)
        this.$notification.error({ message: '删除失败', description: detail })
      }
    }
  }
}
</script>
