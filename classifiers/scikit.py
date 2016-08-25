import sys
import numpy as np
from sklearn.datasets import load_svmlight_file
from sklearn import datasets
from sklearn.svm import SVC
from sklearn import tree
from sklearn.naive_bayes import MultinomialNB
from sklearn import ensemble

if (len(sys.argv)!=5):
	raise ValueError('The number of the parameters is not equal 4 '+len(sys.argv))

train_filename = sys.argv[1]
test_filename = sys.argv[2]
classifier = sys.argv[3]
N_FEATURES = sys.argv[4]
#sys.exit()
#clf = MultinomialNB(alpha=0.1)

X_train,y_train = load_svmlight_file(train_filename, n_features=N_FEATURES, dtype=np.float64, multilabel=True)

if (classifier == "svm"):
	clf = SVC(C=100.0, kernel='rbf', cache_size=200);
elif (classifier == "decisiontree"):
	clf = tree.DecisionTreeClassifier()
elif (classifier == "randomforest"):
	# clf = ensemble.RandomForestClassifier(n_estimators=20, max_depth=None, min_samples_split=1, max_features=log2)
	clf = ensemble.RandomForestClassifier(n_estimators=20, max_features="auto")
elif (classifier == "adaboost"):
	clf = ensemble.AdaBoostClassifier(n_estimators=100, learning_rate=0.3)
	# clf = ensemble.AdaBoostClassifier()
else:
	raise ValueError("The classifier " + classifier + " is not found")
#clf = SVC(C=100.0, cache_size=200, class_weight=None, coef0=0.0,
#    decision_function_shape=None, degree=3, gamma='auto', kernel='rbf',
#    max_iter=-1, probability=False, random_state=None, shrinking=True,
#    tol=0.001, verbose=False)


clf.fit(X_train.toarray(), y_train)

X_test,y_test = load_svmlight_file(test_filename, n_features=N_FEATURES, dtype=np.float64, multilabel=True)
y_pred = clf.predict(X_test.toarray())
#print json.dumps(y_pred,indent=4)
y_pred = list(y_pred)

res = [list(tup) if type(tup)==tuple else [tup] for tup in y_pred]

sys.stdout.write(str(res))
