import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Chat'],
    endpoints: (builder) => ({
        getMessages: builder.query({
            query: (userId) => `/chat/getmessage?userId=${userId}`,
            providesTags: ['Chat'],
        })
    })
})

export const { useGetMessagesQuery } = chatApi;