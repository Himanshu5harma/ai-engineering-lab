# Why it works
MRR rewards finding the first useful result early. Graded nDCG also accounts for how strongly relevant documents are ordered. The ideal denominator makes each query comparable under the stated labels, while macro-averaging gives every query equal weight.

Time: O(Q(n+r log r)) including validation and ideal sorting. Space: O(n+Q+r). Partial sorting can reduce ideal-ranking work for small K. Labels and gain functions must be versioned; changing gain definitions changes comparisons.

Follow-ups: confidence intervals over query-level scores; stratification by tenant/region/version; label incompleteness; why these retrieval metrics do not measure final-answer grounding.
