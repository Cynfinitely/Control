export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export function success(message?: string): ActionResult {
  return { ok: true, message };
}

export function failure(error: string): ActionResult {
  return { ok: false, error };
}

export type FormAction = (
  prev: ActionResult | null,
  formData: FormData
) => Promise<ActionResult>;

export function wrapFormAction(
  fn: (formData: FormData) => Promise<ActionResult>,
  defaultSuccess?: string
): FormAction {
  return async (_prev, formData) => {
    try {
      const result = await fn(formData);
      if (result.ok && !result.message && defaultSuccess) {
        return { ok: true, message: defaultSuccess };
      }
      return result;
    } catch {
      return failure("Something went wrong. Please try again.");
    }
  };
}
