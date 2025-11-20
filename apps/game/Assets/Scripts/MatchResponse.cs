using System;
using System.Collections.Generic;

[Serializable]
public class MatchCandidate
{
    public string asset_id;
    public float match_score;
    public float suggested_scale;
    public List<float> suggested_rotation;
}

[Serializable]
public class MatchResponse
{
    public List<MatchCandidate> candidates;
}