"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { apiRequest, ApiError, type Recipient, type SendResult } from "../../api-client";
import { DashboardSelect } from "./dashboard-select";

export function SendDigestForm({ runId, mailingHref, onNotice }: { runId: string; mailingHref: string; onNotice?: (message: string, kind?: "success" | "error" | "info") => void }) {
  const [recipients,setRecipients] = useState<Recipient[]>([]);
  const [loading,setLoading] = useState(true);
  const [mode,setMode] = useState<"all" | "selected">("all");
  const [selected,setSelected] = useState<string[]>([]);
  const [dryRun,setDryRun] = useState(false);
  const [sending,setSending] = useState(false);
  const [error,setError] = useState("");
  const [result,setResult] = useState<SendResult | null>(null);
  useEffect(() => {
    const controller=new AbortController();
    apiRequest<{recipients:Recipient[]}>("recipients","GET",undefined,controller.signal)
      .then(data=>setRecipients(data.recipients || []))
      .catch(error=>{if(!controller.signal.aborted) setError(error instanceof Error ? error.message : "Не удалось загрузить получателей.");})
      .finally(()=>{if(!controller.signal.aborted) setLoading(false);});
    return ()=>controller.abort();
  },[]);
  const enabled=recipients.filter(item=>item.status==="send");
  const count=mode==="all" ? enabled.length : selected.length;
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(sending || loading || !count) return;
    setSending(true);setError("");setResult(null);
    try {
      const body={mode,...(mode==="selected"?{recipient_ids:selected}:{}),...(dryRun?{dry_run:true}:{})};
      const data=await apiRequest<SendResult>("runs/"+encodeURIComponent(runId)+"/send","POST",body);
      setResult(data);
      const failures=data.results.filter(item=>item.result==="error").length;
      onNotice?.(data.dry_run ? "Проверка завершена. Письма не отправлялись." : failures ? "Рассылка завершена с ошибками. Проверьте результаты ниже." : "Рассылка отправлена.",failures ? "error" : "success");
    } catch(error) {
      if(error instanceof ApiError && error.data && typeof error.data==="object" && "results" in error.data) setResult(error.data as SendResult);
      const message=error instanceof Error ? error.message : "Не удалось отправить дайджест.";
      setError(message);onNotice?.(message,"error");
    } finally {setSending(false);}
  }
  return <form className="dash-dialog-form" onSubmit={submit}>
    <p>Готовый дайджест будет отправлен получателям из вашего списка. <Link href={mailingHref} className="dash-inline-link">Управлять адресами</Link></p>
    <DashboardSelect
      label="Кому отправить"
      showLabel
      disabled={sending || loading}
      value={mode}
      options={[
        { value: "all", label: `Всем со статусом «Отправлять» (${enabled.length})` },
        { value: "selected", label: "Только выбранным получателям" },
      ]}
      onChange={(next) => {
        setMode(next);
        setError("");
        setResult(null);
      }}
    />
    {loading ? <p role="status">Загружаем получателей…</p> : enabled.length===0 ? <p>Нет адресов со статусом «Отправлять». Добавьте адреса или измените их статус в разделе «Рассылка».</p> : mode==="selected" && <fieldset className="send-recipients"><legend>Получатели</legend>{recipients.map(item=><label key={item.id} className="send-recipient"><input type="checkbox" disabled={sending || item.status!=="send"} checked={selected.includes(item.id)} onChange={event=>setSelected(current=>event.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))} /><span>{item.email}</span>{item.status==="skip"&&<small>Не отправлять</small>}</label>)}</fieldset>}
    <label className="send-recipient"><input type="checkbox" disabled={sending} checked={dryRun} onChange={event=>{setDryRun(event.target.checked);setResult(null);}} /><span>Проверка без отправки писем</span></label>
    <p className="dash-dialog-note">{dryRun ? "SMTP не вызывается: будет записана только попытка отправки." : `Будет отправлено писем: ${count}.`}</p>
    {error&&<p className="dash-error" role="alert">{error}</p>}
    {result&&<div className="send-results" role="status"><strong>{result.dry_run?"Результат проверки":"Результат отправки"}</strong><ul>{result.results.map((item,index)=><li key={item.email+index}><span>{item.email}</span><span className={item.result==="error"?"dash-error":"dash-feedback"}>{item.result==="sent"?"Отправлено":item.result==="error"?"Ошибка отправки":item.result==="dry-run"?"Проверено без отправки":item.result}</span>{item.error&&<small>{item.error}</small>}</li>)}</ul></div>}
    <button type="submit" className="dash-button dash-button-primary" disabled={sending || loading || !count}><PaperPlaneTilt size={16}/>{sending?"Выполняем…":dryRun?"Проверить без отправки":"Отправить дайджест"}</button>
  </form>;
}
