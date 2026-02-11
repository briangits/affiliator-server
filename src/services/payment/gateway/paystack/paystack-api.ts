import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

const PAYSTACK_API_ENDPOINT = process.env.PAYSTACK_API_ENDPOINT
const PAYSTACK_API_KEY = process.env.PAYSTACK_API_KEY

const client = axios.create({
    baseURL: PAYSTACK_API_ENDPOINT,
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${PAYSTACK_API_KEY}`
    }
})

client.interceptors.response.use(
    response => response,
    error => {
        console.error('Payment callback error', error?.response?.data)
        throw error
    }
)

const PaystackAPI = {
    get<T>(path: string, config?: AxiosRequestConfig<T>) {
        return client.get(path, config)
    },
    post<T, D>(path: string, data?: D, config?: AxiosRequestConfig<D>) {
        return client.post<T, AxiosResponse<T>, D>(path, data, config)
    }
}

export default PaystackAPI
