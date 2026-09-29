import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from data.training_data import training_data

descriptions = [item[0] for item in training_data]
labels = [item[1] for item in training_data]

model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])

model.fit(descriptions, labels)

with open("severity_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved successfully!")

test_samples = [
    "Fire in the building, people trapped",
    "Streetlight is not working",
    "Man seen with a knife threatening people",
]

predictions = model.predict(test_samples)
for sample, pred in zip(test_samples, predictions):
    print(f"'{sample}' -> {pred}")