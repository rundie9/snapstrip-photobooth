/**
 * One fetch wrapper for the booth API. The session lives in an HttpOnly
 * cookie, so nothing here ever touches localStorage, and every write carries
 * the XSRF token Laravel drops in its own cookie.
 */

const BASE = '/api/v1';

function csrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export class ApiError extends Error {
    constructor(message, { status = 0, details = [], traceId = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
        this.traceId = traceId;
    }

    fieldError(field) {
        return this.details.find((detail) => detail.field === field)?.issue ?? null;
    }
}

async function request(path, { method = 'GET', body, form } = {}) {
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (method !== 'GET') {
        headers['X-XSRF-TOKEN'] = csrfToken();
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(BASE + path, {
        method,
        headers,
        credentials: 'same-origin',
        body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    });

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(payload?.error?.message ?? 'Permintaan tidak bisa diproses.', {
            status: response.status,
            details: payload?.error?.details ?? [],
            traceId: payload?.error?.traceId ?? null,
        });
    }

    return payload;
}

export const api = {
    layouts: () => request('/layouts').then((payload) => payload.data),

    openSession: (input) =>
        request('/booth-sessions', { method: 'POST', body: input }).then((payload) => payload.data),

    submitCaptures: (sessionId, form) =>
        request(`/booth-sessions/${sessionId}/captures`, { method: 'POST', form }).then(
            (payload) => payload.data,
        ),

    currentStaff: () => request('/auth/session').then((payload) => payload.data),

    login: (credentials) =>
        request('/auth/login', { method: 'POST', body: credentials }).then((payload) => payload.data),

    logout: () => request('/auth/logout', { method: 'POST' }),

    accessCodes: () => request('/access-codes'),

    createAccessCode: () =>
        request('/access-codes', { method: 'POST' }).then((payload) => payload.data),
};
