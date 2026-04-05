/**
 * Заглушка бэкенда: приём пакета КЭП после подписи на клиенте.
 * Kotlin (пример): POST /api/v1/university/diplomas/signed — тело: поля диплома + подпись + алгоритм + отпечаток ключа.
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

/**
 * @param {{
 *   fullName: string,
 *   year: number,
 *   specialty: string,
 *   diplomaNumber: string,
 *   signatureBase64: string,
 *   capAlgorithm: string,
 *   signingKeyThumbprint: string,
 *   signedAt: string,
 * }} payload
 * @returns {Promise<{ accepted: boolean, receiptId: string }>}
 */
export async function submitSignedDiplomaPackageStub(payload) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  void payload;
  await new Promise((r) => setTimeout(r, 380));
  return Promise.resolve({
    accepted: true,
    receiptId: `cap-stub-${Date.now()}`,
  });
}
