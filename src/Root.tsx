import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import App from "./App";
import LoginView from "./components/LoginView";
import { createKvStore, migrateIfEmpty, type KV } from "./lib/kvStore";
import { localStorageStore, readLocalRows } from "./lib/storage";
import { supabase, supabaseKv } from "./lib/supabase";

/** 로그인 여부를 확인하고, 알맞은 저장소를 App 에 넘겨 줍니다. */
export default function Root() {
  // 키 값이 없으면(서버 설정 전) 예전처럼 이 기기에만 저장합니다.
  if (!supabase) return <App store={localStorageStore} />;
  return <WithAuth />;
}

function WithAuth() {
  const client = supabase!;
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [ready, setReady] = useState(false);
  const errTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [client]);

  const userId = session?.user.id ?? null;

  const kv: KV | null = useMemo(() => (userId ? supabaseKv(client) : null), [client, userId]);
  const store = useMemo(
    () =>
      kv
        ? createKvStore(kv, () => {
            setSaveError(true);
            window.clearTimeout(errTimer.current);
            errTimer.current = window.setTimeout(() => setSaveError(false), 5000);
          })
        : null,
    [kv],
  );

  // 처음 로그인했을 때, 서버가 비어 있으면 이 기기의 기록을 한 번 올립니다.
  useEffect(() => {
    setReady(false);
    if (!kv) return;
    let alive = true;
    void migrateIfEmpty(kv, readLocalRows())
      .catch(() => 0)
      .then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [kv]);

  async function signIn() {
    setBusy(true);
    setError(null);
    const { error: e } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (e) {
      setError("로그인을 시작하지 못했어요. 잠시 뒤에 다시 눌러 주세요.");
      setBusy(false);
    }
  }

  if (checking) return <div className="wrap" aria-busy="true" />;
  if (!session || !store) return <LoginView onGoogle={() => void signIn()} error={error} busy={busy} />;
  if (!ready) return <div className="wrap" aria-busy="true" />;

  return (
    <>
      <App key={session.user.id} store={store} email={session.user.email} onSignOut={() => void client.auth.signOut()} />
      {saveError && (
        <div className="snack notice" role="alert">
          <span>서버에 저장하지 못했어요. 인터넷을 확인해 주세요.</span>
        </div>
      )}
    </>
  );
}
