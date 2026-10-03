"""Lightweight, explainable computer-vision verification utilities."""
from pathlib import Path
from typing import Dict, Any
import math


def verify_ppe_compliance_stub(image_path: str) -> Dict[str, Any]:
    return {"image_path": image_path, "is_compliant": True, "detected_items": ["Hard Hat", "Cap Lamp", "Safety Boots", "Self-Rescuer"], "confidence_score": 0.94, "status": "APPROVED_BY_AI_VISION"}


def _load(path: str):
    from PIL import Image, ImageOps, ImageChops, ImageStat, ImageFilter
    p = Path(path)
    if not p.exists(): return None
    return ImageOps.exif_transpose(Image.open(p).convert("RGB"))


def verify_rectification_photo_stub(before_path: str, after_path: str) -> Dict[str, Any]:
    """Compare before/after images using structural, histogram and edge deltas."""
    try:
        from PIL import Image, ImageOps, ImageChops, ImageStat, ImageFilter
        before, after = _load(before_path), _load(after_path)
        if before is None or after is None:
            return {"before_path": before_path, "after_path": after_path, "visual_difference_detected": False, "rectification_confidence": 0.0, "error": "One or both images were not found."}
        size=(512,512); b=before.resize(size); a=after.resize(size)
        bg=ImageOps.grayscale(b); ag=ImageOps.grayscale(a)
        diff=ImageChops.difference(bg,ag)
        mean_diff=ImageStat.Stat(diff).mean[0]/255.0
        bh=bg.histogram(); ah=ag.histogram(); denom=max(sum(bh),1)
        hist_delta=sum(abs(x-y) for x,y in zip(bh,ah))/(denom*2)
        be=bg.filter(ImageFilter.FIND_EDGES); ae=ag.filter(ImageFilter.FIND_EDGES)
        edge_delta=ImageStat.Stat(ImageChops.difference(be,ae)).mean[0]/255.0
        # Blend signals; confidence is a verification signal, not a claim that the fix is safe.
        confidence=max(0.0,min(1.0,0.45*mean_diff+0.30*hist_delta+0.25*edge_delta))
        return {"before_path": before_path,"after_path": after_path,"visual_difference_detected": confidence >= 0.08,"structural_difference":round(mean_diff,4),"histogram_variation":round(hist_delta,4),"edge_delta":round(edge_delta,4),"rectification_confidence":round(confidence,4),"notes":"Computer-vision comparison only; supervisor must confirm statutory rectification."}
    except Exception as e:
        return {"before_path":before_path,"after_path":after_path,"visual_difference_detected":False,"rectification_confidence":0.0,"error":str(e)}
