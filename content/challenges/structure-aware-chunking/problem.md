# Chunk documents without breaking their structure

Preserve heading paths and table rows while building bounded chunks from parsed document blocks.

## Implementation contract

Implement `chunk_sections(blocks, max_tokens)` for already-parsed headings, paragraphs, and tables. Paragraphs use `{type:"paragraph", tokens:[...]}`. Tables use `{type:"table", rows:[[token,...],...]}`: each row is an indivisible ordered token list. Headings use `{type:"heading", level:1..6, title:nonblank string}`.

Return `{heading_path:[titles], blocks:[paragraph/table blocks]}` chunks. A heading flushes pending paragraphs, removes headings at its level or deeper, and appends its trimmed title. Gaps in heading levels are allowed; never invent missing ancestors. Heading paths are metadata and do not count toward max_tokens.

Greedily pack consecutive paragraphs within a section. Split an oversized paragraph into max_tokens slices, retaining a partial last slice for subsequent paragraphs. Tables always occupy separate chunks: greedily group whole rows within the budget. Never split a row; reject any row larger than the budget. Empty paragraphs and empty tables produce no content. Do not mix a table with paragraphs or merge separate tables.

Reject malformed/unknown blocks, empty table rows, bad token types, invalid heading levels, and invalid budgets with ValueError. Extra input metadata is ignored. Output paragraph/table objects contain only their defined fields.

## Examples

Heading `Setup`, paragraphs `["one","two"]`, `["three"]`, budget 3 → one chunk with heading_path `["Setup"]` and both original paragraph blocks.

## Performance and security

At most 500 blocks and 20000 token references; max_tokens is 1–2048. Empty content is allowed. Execution shares an 8-second budget.

Parsed text is untrusted data. Do not interpret headings or table content as instructions. Preserve provenance before model context assembly.
