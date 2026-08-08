import pytest
from unittest.mock import patch, MagicMock
from src.services.email_service import EmailService

@pytest.fixture
def configured_email_svc(monkeypatch):
    monkeypatch.setattr("src.services.email_service.settings.SMTP_SERVER", "smtp.test.com")
    monkeypatch.setattr("src.services.email_service.settings.SMTP_PORT", 587)
    monkeypatch.setattr("src.services.email_service.settings.SMTP_USERNAME", "test@test.com")
    monkeypatch.setattr("src.services.email_service.settings.SMTP_PASSWORD", "password")
    monkeypatch.setattr("src.services.email_service.settings.SMTP_FROM_EMAIL", "test@test.com")
    return EmailService()

@pytest.fixture
def unconfigured_email_svc(monkeypatch):
    monkeypatch.setattr("src.services.email_service.settings.SMTP_SERVER", "")
    return EmailService()

@patch("src.services.email_service.smtplib.SMTP")
def test_send_started_email_success(mock_smtp, configured_email_svc):
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    configured_email_svc.send_started_email("recipient@test.com", "https://track.url")
    
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("test@test.com", "password")
    mock_server.send_message.assert_called_once()
    
    # Assert email structure
    sent_msg = mock_server.send_message.call_args[0][0]
    assert sent_msg["Subject"] == "Your Structurify Data is Processing"
    assert sent_msg["To"] == "recipient@test.com"
    assert "https://track.url" in str(sent_msg)

@patch("src.services.email_service.smtplib.SMTP")
def test_send_success_email_success(mock_smtp, configured_email_svc):
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    configured_email_svc.send_success_email("recipient@test.com", "https://download.url")
    
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("test@test.com", "password")
    mock_server.send_message.assert_called_once()
    
    sent_msg = mock_server.send_message.call_args[0][0]
    assert sent_msg["Subject"] == "Your Structurify Data is Ready!"
    assert sent_msg["To"] == "recipient@test.com"
    assert "https://download.url" in str(sent_msg)

@patch("src.services.email_service.smtplib.SMTP")
def test_send_skipped_when_unconfigured(mock_smtp, unconfigured_email_svc):
    unconfigured_email_svc.send_started_email("recipient@test.com", "https://track.url")
    mock_smtp.assert_not_called()
