import Vue from 'vue'
import Router from 'vue-router'

import Order from '@/views/Order'
import Assign from '@/views/Assign'
import Technician from '@/views/Technician'
import Project from '@/views/Project'
import ProjectOld from '@/views/Project.old'
import Attendance from '@/views/Attendance'
import Setting from '@/views/Setting'
import Screen from '@/views/Screen'
import Fee from '@/views/Fee'
import Report from '@/views/Report'
import Server from '@/views/Server'
import ClockSchedule from '@/views/ClockSchedule'
import WorkingTable from '@/views/WorkingTable'
import ParameterSettings from '@/views/ParameterSettings'
import WaitingConfig from '@/views/WaitingConfig'
import RateConfig from '@/views/RateConfig'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', redirect: '/clockschedule' },
    { path: '/order', component: Order },
    { path: '/report', component: Report },
    { path: '/assign', component: Assign },
    { path: '/technician', component: Technician },
    { path: '/project', component: Project },
    { path: '/projectold', component: ProjectOld },
    { path: '/attendance', component: Attendance },
    {
      path: '/setting',
      component: Setting,
      children: [
        { path: 'parameterSettings', component: ParameterSettings },
        { path: 'waitingConfig', component: WaitingConfig },
        { path: 'rateConfig', component: RateConfig },
        { path: '', redirect: 'parameterSettings' }
      ]
    },
    { path: '/screen', component: Screen },
    { path: '/fee', component: Fee },
    { path: '/server', component: Server },
    { path: '/clockschedule', component: ClockSchedule },
    { path: '/workingTable', component: WorkingTable }
  ]
})
