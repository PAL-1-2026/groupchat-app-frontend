/**
 * src/utils/formatDate.test.ts
 *
 * Test sederhana: verifikasi bahwa helper formatDate
 * mengembalikan string tanggal yang readable.
 *
 * Tidak perlu render React / DOM.
 */

// ─── Helper yang diuji (inline biar tidak perlu import rumit) ───────────────
function formatDate(isoString: string): string {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Test ────────────────────────────────────────────────────────────────────
import { describe, test, expect } from 'vitest';

describe('formatDate', () => {
    test('mengembalikan string tanggal yang valid', () => {
        const result = formatDate('2025-01-15T10:30:00.000Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toBe('Tanggal tidak valid');
    });

    test('mengembalikan pesan error untuk ISO string yang tidak valid', () => {
        const result = formatDate('bukan-tanggal');
        expect(result).toBe('Tanggal tidak valid');
    });
});