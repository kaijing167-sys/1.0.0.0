CLASSES = [
    dict(id=2, name="2班", combination="物化生", level="尖子班", subjects=["physics","chemistry","biology"], track="science", size=50),
    dict(id=4, name="4班", combination="物化生", level="普通班", subjects=["physics","chemistry","biology"], track="science", size=50),
    dict(id=7, name="7班", combination="物化政", level="普通班", subjects=["physics","chemistry","politics"], track="science", size=50),
    dict(id=8, name="8班", combination="物化地", level="普通班", subjects=["physics","chemistry","geography"], track="science", size=50),
    dict(id=11, name="11班", combination="政史地", level="尖子班", subjects=["politics","history","geography"], track="arts", size=50),
    dict(id=13, name="13班", combination="政史地", level="普通班", subjects=["politics","history","geography"], track="arts", size=50),
    dict(id=14, name="14班", combination="史政生", level="普通班", subjects=["history","politics","biology"], track="arts", size=30),
]
CLASS_BY_ID = {item["id"]: item for item in CLASSES}
