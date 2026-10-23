"""Tracked discovery profiles and channel policy."""

from dataclasses import asdict, dataclass

from common import CHANNEL_POLICY_PATH, PROFILES_PATH, read_json, write_json


@dataclass(frozen=True)
class LanguageProfile:
    languageCode: str
    youtubeLanguage: str
    languageName: str
    regionCodes: list[str]
    queries: list[str]
    excludeTerms: list[str]
    minDurationSeconds: int = 20
    maxDurationSeconds: int = 180
    queueSize: int = 30
    enabled: bool = True

    def validate(self) -> None:
        if len(self.languageCode) != 3 or len(self.youtubeLanguage) < 2:
            raise ValueError("Language codes are invalid")
        if not self.languageName.strip() or not self.queries:
            raise ValueError("Language name and at least one query are required")
        if not 0 < self.minDurationSeconds < self.maxDurationSeconds:
            raise ValueError("Duration range is invalid")
        if not 0 < self.queueSize <= 100:
            raise ValueError("Queue size must be between 1 and 100")


@dataclass(frozen=True)
class ChannelPolicy:
    channelId: str
    channelName: str
    state: str
    languageCodes: list[str]
    note: str = ""


def load_profiles() -> list[LanguageProfile]:
    raw = read_json(PROFILES_PATH)
    profiles = [LanguageProfile(**item) for item in raw.get("profiles", [])]
    for profile in profiles:
        profile.validate()
    return profiles


def save_profiles(profiles: list[LanguageProfile]) -> None:
    for profile in profiles:
        profile.validate()
    write_json(PROFILES_PATH, {"profiles": [asdict(profile) for profile in profiles]})


def load_channel_policies() -> dict[str, ChannelPolicy]:
    raw = read_json(CHANNEL_POLICY_PATH)
    policies = [ChannelPolicy(**item) for item in raw.get("channels", [])]
    return {policy.channelId: policy for policy in policies}


def save_channel_policy(policy: ChannelPolicy) -> None:
    if policy.state not in {"trusted", "blocked"}:
        raise ValueError("Channel state must be trusted or blocked")
    policies = load_channel_policies()
    previous = policies.get(policy.channelId)
    if previous:
        policy = ChannelPolicy(
            policy.channelId, policy.channelName or previous.channelName, policy.state,
            sorted(set(previous.languageCodes) | set(policy.languageCodes)), policy.note or previous.note,
        )
    policies[policy.channelId] = policy
    ordered = sorted(policies.values(), key=lambda item: (item.channelName.lower(), item.channelId))
    write_json(CHANNEL_POLICY_PATH, {"channels": [asdict(item) for item in ordered]})


def remove_channel_policy(channel_id: str) -> None:
    policies = load_channel_policies()
    policies.pop(channel_id, None)
    write_json(CHANNEL_POLICY_PATH, {"channels": [asdict(item) for item in policies.values()]})
