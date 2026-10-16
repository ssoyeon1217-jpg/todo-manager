interface Props {
  onGoogle: () => void;
  error: string | null;
  busy: boolean;
}

/** 로그인 전에 보이는 화면 */
export default function LoginView({ onGoogle, error, busy }: Props) {
  return (
    <div className="wrap login">
      <header>
        <div className="title">
          <p className="eyebrow">할일 관리</p>
          <h1>로그인</h1>
        </div>
      </header>
      <p className="rhint">로그인하면 휴대폰과 컴퓨터에서 같은 할 일을 볼 수 있어요.</p>
      <button type="button" className="primary-btn" onClick={onGoogle} disabled={busy}>
        {busy ? "이동 중이에요…" : "Google로 로그인"}
      </button>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
