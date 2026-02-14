import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (data) => ({
                url: '/user/login',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['User'],
        })
    })
})

export const { useLoginMutation } = authApi;