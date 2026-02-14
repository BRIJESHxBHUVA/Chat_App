import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User'], 
    endpoints: (builder) => ({
        getUser: builder.query({
            query: () => '/user',
            providesTags: ['User'],
        })
    })
})

export const { useGetUserQuery } = userApi;