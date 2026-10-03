"""Final-release smoke suite for SIH26024 enhancement plan."""
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from app.main import app
from app.seed_data import seed_database
seed_database()

client = TestClient(app)


def test_manager_isolation():
    params={"mine":"ALL","user_role":"manager","user_mine":"BCCL - Jharia Colliery","status":"ALL"}
    for ep in ["/api/v1/analytics/violations","/api/v1/analytics/closed-violations-last-7-days","/api/v1/analytics/recurring-violations","/api/v1/analytics/anomalies"]:
        r=client.get(ep,params=params); assert r.status_code==200, r.text
        if isinstance(r.json(),list): assert all(x.get("mine_name","").startswith("BCCL") for x in r.json())
    r=client.get("/api/v1/gis/mines",params=params); assert r.status_code==200
    assert all(x["mine_name"].startswith("BCCL") for x in r.json())


def test_ocr_samples():
    for typ, expected in [("CONTRACTOR_LICENSE","license_number"),("INSPECTION_REGISTER","document_class"),("CTO_CERTIFICATE","document_class")]:
        r=client.get(f"/api/v1/ocr/sample/{typ}"); assert r.status_code==200
        r=client.post("/api/v1/ocr/digitize",files={"file":("sample.pdf",r.content,"application/pdf")},data={"document_type":typ})
        assert r.status_code==200 and expected in r.json()["extracted_fields"]


def test_real_cv_comparison():
    root=Path(__file__).parent/".final_cv"; root.mkdir(exist_ok=True)
    Image.new("RGB",(300,300),"white").save(root/"before.png")
    after=Image.new("RGB",(300,300),"white"); ImageDraw.Draw(after).rectangle((50,50,250,250),fill="black"); after.save(root/"after.png")
    r=client.post("/api/v1/verifications/vision",params={"before_photo_url":str(root/"before.png"),"after_photo_url":str(root/"after.png")})
    assert r.status_code==200 and r.json()["visual_difference_detected"] is True and r.json()["rectification_confidence"]>0


def test_role_matrix_source():
    js=(Path(__file__).parents[1]/"frontend"/"app.js").read_text(encoding="utf-8")
    assert 'allowedScreens:[1,2,3,4,5,16]' in js
    assert 'allowedScreens:[1,6,7,16]' in js
    assert 'allowedScreens:[1,8,10,12,16,19]' in js
    assert 'allowedScreens:[1,9,10,12,13,14,15,16,17,18,19]' in js
    assert 'allowedScreens:[1,9,10,11,12,13,14,15,16,17,18,19]' in js

if __name__ == "__main__":
    test_manager_isolation(); test_ocr_samples(); test_real_cv_comparison(); test_role_matrix_source(); print("FINAL RELEASE SMOKE TESTS: PASS")
