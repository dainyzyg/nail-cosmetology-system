import Vue from 'vue'
import Router from 'vue-router'

import Order from '@/views/Order'
import Assign from '@/views/Assign'
import Technician from '@/views/Technician'
import Project from '@/views/Project'
import Attendance from '@/views/Attendance'
import Setting from '@/views/Setting'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', redirect: '/order' },
    { path: '/order', component: Order },
    { path: '/assign', component: Assign },
    { path: '/technician', component: Technician },
    { path: '/project', component: Project },
    { path: '/attendance', component: Attendance },
    { path: '/setting', component: Setting }
  ]
})
