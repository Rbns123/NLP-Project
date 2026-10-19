import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.core.normalization import normalize_dataset_name, normalize_metric_name

class ScientificEntity(BaseModel):
    id: str
    text: str
    normalized_text: str
    label: str  # METHOD, DATASET, METRIC, TASK, TOOL, AUTHOR
    confidence: float
    source_section: str
    section_id: str
    engine: str  # 'gazetteer_rules', 'regex_patterns', 'transformer_scibert'

# Curated Scientific Gazetteers
GAZETTEER = {
    "METHOD": [
        "bert", "roberta", "scibert", "biobert", "gpt", "gpt-2", "gpt-3", "gpt-4",
        "t5", "bart", "distilbert", "transformer", "lstm", "bilstm", "cnn", "resnet",
        "vit", "llama", "mistral", "xgboost", "random forest", "svm", "fasttext",
        "word2vec", "glove", "crf", "graph neural network", "gnn", "diffusion model",
        "lora", "qlora", "adapter", "rlhf", "dpo", "electra", "deberta", "albert"
    ],
    "DATASET": [
        "squad", "squad 1.1", "squad 2.0", "squad v1.1", "squad v2.0",
        "glue", "superglue", "super glue", "mnli", "sst-2", "sst2", "qnli", "qqp", "rte",
        "mrpc", "wnli", "scierc", "pubmed", "pubmed rct", "pubmed 200k rct",
        "imdb", "cifar-10", "cifar-100", "imagenet", "coco", "ms coco", "conll-2003",
        "ag news", "wikitext-103", "penn treebank", "hotpotqa", "natural questions", "triviaqa"
    ],
    "METRIC": [
        "f1", "f1-score", "f1 score", "f-measure", "macro f1", "micro f1", "macro-f1", "micro-f1",
        "accuracy", "acc", "exact match", "em", "bleu", "bleu-4", "rouge", "rouge-1", "rouge-2",
        "rouge-l", "perplexity", "ppl", "precision", "recall", "auc", "roc-auc", "loss", "cross-entropy"
    ],
    "TASK": [
        "named entity recognition", "ner", "question answering", "qa", "reading comprehension",
        "machine translation", "text classification", "sentiment analysis", "summarization",
        "relation extraction", "information retrieval", "semantic parsing", "coreference resolution",
        "natural language inference", "nli", "object detection", "image classification"
    ],
    "TOOL": [
        "pytorch", "tensorflow", "keras", "hugging face", "huggingface", "transformers",
        "spacy", "scikit-learn", "sklearn", "nltk", "flair", "stanza", "wandb", "tensorboard",
        "deepspeed", "accelerate", "vllm", "ray", "bitsandbytes"
    ]
}

def extract_entities_from_text(
    text: str,
    section_title: str,
    section_id: str
) -> List[ScientificEntity]:
    """
    Tier 1 & Tier 2: Gazetteer dictionary matching and scientific regex patterns.
    """
    entities: List[ScientificEntity] = []
    seen = set()
    counter = 0

    # 1. Gazetteer exact and word-boundary matching
    for label, terms in GAZETTEER.items():
        for term in terms:
            # Escape regex special characters in term (e.g., "gpt-2", "cifar-10")
            escaped_term = re.escape(term)
            pattern = re.compile(rf"\b{escaped_term}\b", re.IGNORECASE)
            
            for m in pattern.finditer(text):
                matched_raw = m.group(0)
                norm = matched_raw
                if label == "DATASET":
                    norm = normalize_dataset_name(matched_raw)
                elif label == "METRIC":
                    norm = normalize_metric_name(matched_raw)
                else:
                    norm = matched_raw.strip()

                key = (label, norm.lower(), section_id)
                if key not in seen:
                    seen.add(key)
                    counter += 1
                    entities.append(ScientificEntity(
                        id=f"ent_{section_id}_{counter}",
                        text=matched_raw,
                        normalized_text=norm,
                        label=label,
                        confidence=0.95,
                        source_section=section_title,
                        section_id=section_id,
                        engine="gazetteer_rules"
                    ))

    # 2. Regex heuristics for model versionings and hyperparameters (e.g. BERT-base, RoBERTa-large)
    model_regex = re.compile(r"\b([A-Za-z0-9]+-(?:base|large|small|mini|medium|tiny|v\d+))\b", re.IGNORECASE)
    for m in model_regex.finditer(text):
        matched_raw = m.group(1)
        key = ("METHOD", matched_raw.lower(), section_id)
        if key not in seen:
            seen.add(key)
            counter += 1
            entities.append(ScientificEntity(
                id=f"ent_{section_id}_{counter}",
                text=matched_raw,
                normalized_text=matched_raw,
                label="METHOD",
                confidence=0.88,
                source_section=section_title,
                section_id=section_id,
                engine="regex_patterns"
            ))

    return entities

def extract_scientific_ner(sections: List[Any]) -> List[ScientificEntity]:
    """
    Extracts all scientific entities across parsed document sections.
    """
    all_entities = []
    for sec in sections:
        sec_entities = extract_entities_from_text(
            text=sec.text,
            section_title=sec.title,
            section_id=sec.id
        )
        all_entities.extend(sec_entities)
    return all_entities
