import copy
import json
import unittest
from pathlib import Path

from server import (
    FALLBACK_ANALYSIS,
    build_demo_analysis,
    build_demo_challenge,
    validate_citations,
)


SOURCES = [{
    "id": "s1",
    "chunks": [{"id": "c1", "text": "The pilot supports up to 10 accounts."}],
}]
VALID_ANALYSIS = {
    "claims": [{
        "id": "claim-1",
        "text": "A limited pilot is possible.",
        "sourceRefs": [{
            "sourceId": "s1",
            "chunkId": "c1",
            "quote": "supports up to 10 accounts",
        }],
    }],
    "options": [{"option": "limited_pilot", "evidenceClaimIds": ["claim-1"]}],
    "recommendedOption": "limited_pilot",
    "readiness": "conditional",
}


class CitationValidationTests(unittest.TestCase):
    def test_accepts_exact_quote_from_known_chunk(self):
        self.assertIs(validate_citations(VALID_ANALYSIS, SOURCES), VALID_ANALYSIS)

    def test_rejects_unknown_source_or_chunk(self):
        invalid = copy.deepcopy(VALID_ANALYSIS)
        invalid["claims"][0]["sourceRefs"][0]["sourceId"] = "unknown"
        with self.assertRaisesRegex(ValueError, "could not be verified"):
            validate_citations(invalid, SOURCES)

    def test_rejects_quote_not_present_in_source(self):
        invalid = copy.deepcopy(VALID_ANALYSIS)
        invalid["claims"][0]["sourceRefs"][0]["quote"] = "supports 100 accounts"
        with self.assertRaisesRegex(ValueError, "could not be verified"):
            validate_citations(invalid, SOURCES)

    def test_rejects_claim_without_source_citation(self):
        invalid = copy.deepcopy(VALID_ANALYSIS)
        invalid["claims"][0]["sourceRefs"] = []
        with self.assertRaisesRegex(ValueError, "needs at least one source citation"):
            validate_citations(invalid, SOURCES)

    def test_rejects_option_referring_to_missing_claim(self):
        invalid = copy.deepcopy(VALID_ANALYSIS)
        invalid["options"][0]["evidenceClaimIds"] = ["missing-claim"]
        with self.assertRaisesRegex(ValueError, "not present"):
            validate_citations(invalid, SOURCES)

    def test_sample_analysis_citations_are_verifiable(self):
        sample_sources = [
            {"id": "source-a", "chunks": [
                {"id": "A-1", "text": "In a fictional set of 12 customer conversations, 8 participants expressed interest in AI Analytics, but only 3 described a near-term use case they would actively deploy."},
            ]},
            {"id": "source-b", "chunks": [
                {"id": "B-1", "text": "Engineering estimates a limited pilot can be enabled for up to 10 accounts using feature flags."},
            ]},
            {"id": "source-c", "chunks": [
                {"id": "C-1", "text": "A recent analytics workload test produced timeout errors at high concurrency; root cause analysis remains open."},
                {"id": "C-2", "text": "The incident owner recommends no broad launch until load tests and rollback procedures pass."},
            ]},
            {"id": "source-d", "chunks": [
                {"id": "D-1", "text": "Feature activation in the fictional internal beta was 22% across 50 invited accounts. This is an early signal rather than evidence of general market demand."},
            ]},
        ]
        validate_citations(FALLBACK_ANALYSIS, sample_sources)
        demo = build_demo_analysis("Should we launch AI Analytics next month?", sample_sources)
        self.assertEqual(demo["readiness"], "conditional")
        self.assertEqual(demo["recommendedOption"], "limited_pilot")

    def test_static_pages_analysis_matches_verifiable_sample_evidence(self):
        sample_sources = [
            {"id": "source-a", "chunks": [
                {"id": "A-1", "text": "In a fictional set of 12 customer conversations, 8 participants expressed interest in AI Analytics, but only 3 described a near-term use case they would actively deploy."},
            ]},
            {"id": "source-b", "chunks": [
                {"id": "B-1", "text": "Engineering estimates a limited pilot can be enabled for up to 10 accounts using feature flags."},
            ]},
            {"id": "source-c", "chunks": [
                {"id": "C-1", "text": "A recent analytics workload test produced timeout errors at high concurrency; root cause analysis remains open."},
                {"id": "C-2", "text": "The incident owner recommends no broad launch until load tests and rollback procedures pass."},
            ]},
            {"id": "source-d", "chunks": [
                {"id": "D-1", "text": "Feature activation in the fictional internal beta was 22% across 50 invited accounts. This is an early signal rather than evidence of general market demand."},
            ]},
        ]
        static_analysis = json.loads(
            (Path(__file__).parent / "demo-analysis.json").read_text(encoding="utf-8")
        )
        validate_citations(static_analysis, sample_sources)

    def test_demo_challenge_returns_grounded_counter_evidence(self):
        challenge = build_demo_challenge("full_launch", [{
            "id": "source-c",
            "chunks": [{"id": "C-1", "text": "A timeout was found; root cause remains open."}],
        }])
        self.assertEqual(len(challenge["counterEvidence"]), 1)
        self.assertEqual(challenge["counterEvidence"][0]["sourceRefs"][0]["chunkId"], "C-1")

    def test_demo_challenge_rejects_unknown_option(self):
        with self.assertRaisesRegex(ValueError, "valid option"):
            build_demo_challenge("unknown", SOURCES)

    def test_non_demo_question_abstains_instead_of_reusing_sample_analysis(self):
        analysis = build_demo_analysis("Should we launch another feature?", SOURCES)
        self.assertEqual(analysis["readiness"], "insufficient_evidence")
        self.assertIsNone(analysis["recommendedOption"])
        self.assertEqual(analysis["claims"], [])


if __name__ == "__main__":
    unittest.main()
