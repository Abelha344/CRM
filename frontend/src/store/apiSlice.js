import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

let getTokenFn = async () => null

export function setApiAuthGetter(fn) {
  getTokenFn = async () => {
    try {
      return await fn()
    } catch {
      return null
    }
  }
}

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: async (headers) => {
    const token = await getTokenFn()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    headers.set('Content-Type', 'application/json')
    return headers
  },
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  // OAuth provider list uses hooks/useOAuthProviders.js (singleton fetch), not RTK Query.
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: ['Lead', 'Task', 'Note', 'Stats', 'User', 'SystemLog'],
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => 'me/',
    }),
    login: builder.mutation({
      query: (body) => ({
        url: 'auth/token/',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation({
      query: (body) => ({
        url: 'auth/register/',
        method: 'POST',
        body,
      }),
    }),
    getAdminUsers: builder.query({
      query: (params = {}) => ({
        url: 'admin/users/',
        params,
      }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    getAdminLogs: builder.query({
      query: (params = {}) => ({
        url: 'admin/logs/',
        params,
      }),
      providesTags: [{ type: 'SystemLog', id: 'LIST' }],
    }),
    patchAdminUserRole: builder.mutation({
      query: ({ profileId, role }) => ({
        url: `admin/users/${profileId}/`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    deleteAdminUser: builder.mutation({
      query: (profileId) => ({
        url: `admin/users/${profileId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'SystemLog', id: 'LIST' },
        { type: 'Lead', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    exportLeadsCsv: builder.mutation({
      query: () => ({
        url: 'admin/export/leads/',
        method: 'GET',
        responseHandler: async (response) => {
          if (!response.ok) {
            const text = await response.text()
            throw new Error(text || response.statusText)
          }
          return response.blob()
        },
      }),
    }),
    getDashboardStats: builder.query({
      query: () => 'dashboard/stats/',
      providesTags: [{ type: 'Stats', id: 'DASH' }],
    }),
    getLeads: builder.query({
      query: (params = {}) => ({
        url: 'leads/',
        params,
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Lead', id })),
              { type: 'Lead', id: 'LIST' },
            ]
          : [{ type: 'Lead', id: 'LIST' }],
    }),
    getLead: builder.query({
      query: (id) => `leads/${id}/`,
      providesTags: (_result, _err, id) => [{ type: 'Lead', id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({
        url: 'leads/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Lead', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `leads/${id}/`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({
        url: `leads/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
        { type: 'Task', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    getNotes: builder.query({
      query: (leadId) => ({
        url: 'notes/',
        params: { lead: leadId },
      }),
      providesTags: (_result, _err, leadId) => [{ type: 'Note', id: `LEAD-${leadId}` }],
    }),
    createNote: builder.mutation({
      query: (body) => ({
        url: 'notes/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Note', id: `LEAD-${arg.lead}` },
        { type: 'Lead', id: arg.lead },
        { type: 'Lead', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    getTasks: builder.query({
      query: (params = {}) => ({
        url: 'tasks/',
        params,
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Task', id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTask: builder.query({
      query: (id) => `tasks/${id}/`,
      providesTags: (_result, _err, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation({
      query: (body) => ({
        url: 'tasks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Lead', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `tasks/${id}/`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `tasks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
        { type: 'Stats', id: 'DASH' },
      ],
    }),
  }),
})

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGetAdminUsersQuery,
  useGetAdminLogsQuery,
  usePatchAdminUserRoleMutation,
  useDeleteAdminUserMutation,
  useExportLeadsCsvMutation,
  useGetDashboardStatsQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useGetNotesQuery,
  useCreateNoteMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = apiSlice
