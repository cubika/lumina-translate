import type { TextAnalysisResult } from '../../services/ai'
import { useTranslation } from '../../hooks/useTranslation'

interface TextAnalysisResultViewProps {
  result: TextAnalysisResult
}

export default function TextAnalysisResultView({ result }: TextAnalysisResultViewProps) {
  const t = useTranslation()

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
      <div className="liquid-glass rounded-[2rem] ghost-border p-8 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold mb-3">
              {t('dictionary.sourceContext')}
            </h3>
            <p className="text-xl font-headline font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">
              {result.originalText}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 max-w-[45%]">
            <span className="px-3 py-1 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim text-xs font-label font-semibold">
              {result.detectedLanguage}
            </span>
            {result.tone && (
              <span className="px-3 py-1 rounded-2xl bg-secondary-fixed-dim/10 text-secondary-fixed-dim text-xs font-label font-semibold text-right">
                {result.tone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="liquid-glass rounded-[2rem] ghost-border p-6">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-primary-fixed-dim/70 font-label font-semibold mb-3">
            {t('dictionary.analysisTranslation')}
          </h3>
          <p className="text-on-surface font-body leading-relaxed whitespace-pre-wrap">
            {result.translation}
          </p>
        </section>

        <section className="liquid-glass rounded-[2rem] ghost-border p-6">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-secondary-fixed-dim/70 font-label font-semibold mb-3">
            {t('dictionary.analysisInterpretation')}
          </h3>
          <p className="text-on-surface/85 font-body leading-relaxed whitespace-pre-wrap">
            {result.interpretation}
          </p>
        </section>
      </div>

      {result.phrases.length > 0 && (
        <section className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary-fixed-dim/70">
              segment
            </span>
            {t('dictionary.analysisPhrases')}
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {result.phrases.map((phrase, index) => (
              <article
                key={`${phrase.text}-${index}`}
                className="rounded-2xl bg-surface-container-high/40 p-5"
              >
                <h4 className="text-lg font-headline font-bold text-secondary-fixed-dim">
                  {phrase.text}
                </h4>
                <p className="text-on-surface/85 text-sm font-body leading-relaxed mt-2">
                  {phrase.meaning}
                </p>
                {phrase.literalMeaning && (
                  <p className="text-on-surface-variant/50 text-xs font-body leading-relaxed mt-2">
                    <span className="font-semibold">
                      {t('dictionary.literalMeaning')}:
                    </span>{' '}
                    {phrase.literalMeaning}
                  </p>
                )}
                {phrase.usage && (
                  <p className="text-on-surface-variant/65 text-xs font-body leading-relaxed mt-3 border-t border-outline-variant/10 pt-3">
                    {phrase.usage}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {result.grammar.length > 0 && (
          <section className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary-fixed-dim/70">
                account_tree
              </span>
              {t('dictionary.analysisGrammar')}
            </h3>
            <div className="flex flex-col gap-3">
              {result.grammar.map((point, index) => (
                <article key={`${point.text}-${index}`} className="rounded-2xl bg-surface-container-high/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-headline font-bold text-on-surface">
                      {point.text}
                    </h4>
                    <span className="px-2.5 py-1 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim text-[10px] font-label font-semibold">
                      {point.role}
                    </span>
                  </div>
                  <p className="text-on-surface-variant/70 text-xs font-body leading-relaxed mt-2">
                    {point.explanation}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {result.keywords.length > 0 && (
          <section className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-secondary-fixed-dim/70">
                key
              </span>
              {t('dictionary.analysisKeywords')}
            </h3>
            <div className="flex flex-col gap-3">
              {result.keywords.map((keyword, index) => (
                <article key={`${keyword.text}-${index}`} className="rounded-2xl bg-surface-container-high/40 p-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-headline font-bold text-secondary-fixed-dim">
                      {keyword.text}
                    </h4>
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/45 font-label font-semibold">
                      {keyword.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-on-surface/80 text-xs font-body leading-relaxed mt-2">
                    {keyword.meaning}
                  </p>
                  {keyword.nuance && (
                    <p className="text-on-surface-variant/55 text-xs font-body leading-relaxed mt-2">
                      {keyword.nuance}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {result.alternatives.length > 0 && (
        <section className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-fixed-dim/70">
              compare_arrows
            </span>
            {t('dictionary.analysisAlternatives')}
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {result.alternatives.map((alternative, index) => (
              <article
                key={`${alternative.text}-${index}`}
                className="rounded-2xl bg-surface-container-high/40 p-4"
              >
                <p className="text-on-surface font-headline font-semibold">
                  {alternative.text}
                </p>
                <p className="text-primary-fixed-dim/75 text-xs font-body mt-1">
                  {alternative.translation}
                </p>
                {alternative.nuance && (
                  <p className="text-on-surface-variant/55 text-xs font-body leading-relaxed mt-2">
                    {alternative.nuance}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
