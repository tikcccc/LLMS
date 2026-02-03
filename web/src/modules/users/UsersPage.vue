<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Users</h2>
        <p class="muted">User management (demo only).</p>
      </div>
      <el-button type="primary">Add User</el-button>
    </div>

    <el-table :data="users" height="calc(100vh - 260px)">
      <el-table-column prop="name" label="Name" min-width="180" />
      <el-table-column prop="role" label="Role" width="160" />
      <el-table-column prop="email" label="Email" min-width="220" />
      <el-table-column prop="status" label="Status" width="120" />
    </el-table>
  </section>
</template>

<script setup>
const users = [
  { name: "Alex Morgan", role: "Site Admin", email: "alex@example.com", status: "Active" },
  { name: "Joyce Lee", role: "Site Officer", email: "joyce@example.com", status: "Active" },
  { name: "Peter Chan", role: "Field Staff", email: "peter@example.com", status: "Invited" },
];
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.muted {
  color: var(--muted);
}
</style>
